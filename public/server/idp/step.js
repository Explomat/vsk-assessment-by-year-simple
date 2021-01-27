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

function getMainSteps(){
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
	return ArrayOptFirstElem(XQuery("sql: \n\
		declare @stepId bigint = ( \n\
			select iss.order_number \n\
			from cc_idp_steps iss \n\
			where \n\
				iss.id = " + curStepId + " \n\
		) \n\
		\n\
		select iss.* \n\
		from cc_idp_steps iss \n\
		where \n\
			iss.order_number = (@stepId + 1) \n\
	"));
}

function getCurrentStep(dpId) {
	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
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
		inner join development_plans dps on dps.id = ccims.development_plan_id \n\
		where \n\
			dps.id = " + dpId + " \n\
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