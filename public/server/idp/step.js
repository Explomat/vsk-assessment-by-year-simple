function create(prevDocId, params) {
	var caDoc = null;
	if (prevDocId != null) {
		caDoc = OpenDoc(UrlFromDocID(Int(prevDocId)));
		caDoc.TopElem.is_active_step = false;
		caDoc.Save();
	}

	var doc = tools.new_doc_by_name('cc_idp_main_flow');
	if (caDoc != null) {
		doc.TopElem.AssignElem(caDoc.TopElem);
	}
	
	doc.TopElem.created_date = new Date();
	doc.TopElem.is_active_step = true;

	for (el in params){
		child = doc.TopElem.OptChild(el);
		child.Value = params[el];
	}
	doc.BindToDb(DefaultDb);
	doc.Save();
	return doc;
}

function calculateMainSteps(mainSteps, startDate){
	var ms = [];

	for (s in mainSteps){
		//alert('startDate: ' + startDate)
		obj = {
			id: String(s.id),
			order_number: OptInt(s.order_number),
			name: String(s.name),
			duration_days: OptInt(s.duration_days),
			duration_months: OptInt(s.duration_months),
			date: Date(startDate)
		}

		if (obj.duration_months == 0){
			obj.date = Date(startDate);
		} else {
			d = obj.duration_months;
			if (d != undefined){
				_date = new Date(startDate);
				nextMonth = (Month(_date) + d) % 12;
				nextMonth = nextMonth == 0 ? 12 : nextMonth;
				nextDay = Day(_date);
				nextYear = Year(_date);
				if ((Month(_date) + d) > 12) {
					nextYear = nextYear + 1;
				}

				if (nextMonth == 2 && nextDay > 28){
					nextDay = 28;
					if ((nextYear % 4) == 0) { //високосный
						nextDay = 29;
					}
				}

				obj.date = Date(nextDay + '.' + nextMonth + '.' + nextYear);
				//obj.date = StrXmlDate(Date(nextDay + '.' + nextMonth + '.' + nextYear));
				//alert('obj.date: ' + obj.date);
			}
		}

		ms.push(obj);
	}
	return ms;
}

function getMainSteps() {
	return XQuery("sql: \n\
		select \n\
			convert(varchar(20), ccimss.id) id, \n\
			ccimss.order_number, \n\
			ccimss.name, \n\
			ccimss.duration_days, \n\
			ccimss.duration_months \n\
		from cc_idp_main_steps ccimss \n\
		order by ccimss.order_number asc \n\
	");
}

function getSteps() {
	return XQuery("sql: \n\
		select \n\
			id, \n\
			order_number, \n\
			name, \n\
			duration \n\
		from cc_idp_steps \n\
	");
}

function getFirstStep() {
	return ArrayOptFirstElem(XQuery("sql: \n\
		select st.* \n\
		from cc_idp_steps st \n\
		order by st.order_number asc \n\
	"));
}

function getFirstMainStep() {
	return ArrayOptFirstElem(XQuery("sql: \n\
		select st.* \n\
		from cc_idp_main_steps st \n\
		order by st.order_number asc \n\
	"));
}

function getNextStepById(curStepId) {
	return ArrayOptFirstElem(
		XQuery("sql: \n\
			declare @stepId bigint = ( \n\
				select iss.order_number \n\
				from cc_idp_steps iss \n\
				where iss.id = " + curStepId + " \n\
			) \n\
			\n\
			select iss.* \n\
			from cc_idp_steps iss \n\
			where \n\
				iss.order_number = (@stepId + 1) \n\
		")
	);
}

function getCurrentStep(dpId) {
	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			imfs.id, \n\
			imfs.current_collaborator_id, \n\
			imfs.next_collaborator_id, \n\
			iss.id idp_step_id, \n\
			iss.name idp_step_name, \n\
			iss.order_number idp_step_order_number, \n\
			imss.id idp_main_step_id, \n\
			imss.name idp_main_step_name, \n\
			imss.order_number idp_main_step_order_number \n\
		from cc_idp_mains ccims \n\
		inner join cc_idp_main_flows imfs on imfs.idp_main_id = ccims.id \n\
		inner join cc_idp_main_steps imss on imss.id = imfs.idp_main_step_id \n\
		inner join cc_idp_steps iss on iss.id = imfs.idp_step_id \n\
		where \n\
			ccims.development_plan_id = " + dpId + " \n\
			and imfs.is_active_step = 1 \n\
	"));
}

function getLastMainStep(){
	return ArrayOptFirstElem(XQuery("sql: \n\
		select ccas.* \n\
		from cc_idp_main_steps ccas \n\
		inner join ( \n\
			select \n\
				max(order_number) orn \n\
			from cc_idp_main_steps \n\
		) c on c.orn = ccas.order_number \n\
	"));
}

function getLastStepByMainStepId(dpId, mainStepId){
	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			imfs.id, \n\
			imfs.current_collaborator_id, \n\
			imfs.next_collaborator_id, \n\
			imfs.idp_step_id, \n\
			ast.order_number idp_step_order_number, \n\
			imss.id idp_main_step_id, \n\
			imss.order_number idp_main_step_order_number \n\
		from cc_idp_main_flows imfs \n\
		inner join ( \n\
			select iss.*  \n\
			from cc_idp_steps iss \n\
			inner join ( \n\
				select \n\
					max(order_number) orn \n\
				from cc_idp_steps \n\
			) c on c.orn = iss.order_number \n\
		) ast on ast.id = imfs.idp_step_id \n\
		inner join cc_idp_main_steps imss on imss.id = imfs.idp_main_step_id \n\
		inner join cc_idp_mains ims on ims.id = imfs.idp_main_id \n\
		where \n\
			ims.development_plan_id = " + dpId + " \n\
			and imss.id = " + mainStepId + " \n\
	"));
}

function getProcessSteps(roleName, stepId, actionName) {
	return XQuery("sql: \n\
		select \n\
			d.*, \n\
			irs1.code next_idp_role_code \n\
		from ( \n\
			select \n\
				ars.id, \n\
				ast.order_number, \n\
				ars.idp_action_flow_id, \n\
				aps.code idp_action_flow_code, \n\
				ars.current_idp_step_id, \n\
				ars.current_idp_role_id, \n\
				irs.code current_idp_role_code, \n\
				ars.next_idp_step_id, \n\
				ast.name next_idp_step_name, \n\
				ast.order_number next_idp_step_order_number, \n\
				case \n\
					when ars.next_idp_role_id is not null then ars.next_idp_role_id \n\
					when ars.next_idp_role_id is null then ars.current_idp_role_id \n\
				end next_idp_role_id, \n\
				ns.code notification_code \n\
			from \n\
				cc_idp_role_operations ars \n\
			inner join cc_idp_action_flows aps on aps.id = ars.idp_action_flow_id \n\
			inner join cc_idp_steps ast on ast.id = ars.next_idp_step_id \n\
			inner join cc_idp_roles irs on irs.id = ars.current_idp_role_id \n\
			left join notifications ns on ns.id = ars.notification_id \n\
		) d \n\
		inner join cc_idp_roles irs1 on irs1.id = d.next_idp_role_id \n\
		where \n\
			d.current_idp_role_code = '" + roleName + "' \n\
			and d.current_idp_step_id = " + stepId + " \n\
			and d.idp_action_flow_code = '" + actionName + "' \n\
		order by d.order_number asc \n\
	");
}