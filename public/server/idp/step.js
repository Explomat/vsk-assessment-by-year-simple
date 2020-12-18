function create(prevDocId, params){
	var caDoc = OpenDoc(UrlFromDocID(Int(prevDocId)));
	caDoc.TopElem.is_active_step = false;
	caDoc.Save();

	var doc = tools.new_doc_by_name('cc_custom_adaptation');
	doc.TopElem.AssignElem(caDoc.TopElem);
	doc.TopElem.created_date = new Date();
	doc.TopElem.is_active_step = true;
	doc.TopElem.data = null;

	for (el in params){
		child = doc.TopElem.OptChild(el);
		child.Value = params[el];
	}
	doc.BindToDb(DefaultDb);
	doc.Save();
	return doc;
}

function getSteps(){
	return XQuery("sql: \n\
		select ccas.* \n\
		from cc_adaptation_steps ccas \n\
	")
}

function getMainSteps(){
	return XQuery("sql: \n\
		select \n\
			convert(varchar(max), ams.id) id, \n\
			ams.description, \n\
			ams.duration, \n\
			ams.order_number, \n\
			ams.type_id \n\
		from cc_adaptation_main_steps ams \n\
		order by ams.order_number asc \n\
	");
}

function getLastStep(){
	return ArrayOptFirstElem(XQuery("sql: \n\
		select ccas.* \n\
		from cc_adaptation_steps ccas \n\
		inner join ( \n\
			select \n\
				max(order_number) orn \n\
			from cc_adaptation_steps \n\
		) c on c.orn = ccas.order_number \n\
	"));
}

function getLastMainStep(){
	return ArrayOptFirstElem(XQuery("sql: \n\
		select ccas.* \n\
		from cc_adaptation_main_steps ccas \n\
		inner join ( \n\
			select \n\
				max(order_number) orn \n\
			from cc_adaptation_main_steps \n\
		) c on c.orn = ccas.order_number \n\
	"));
}

function getLastStepByMainStepId(crid, mainStepId){
	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			ca.id, \n\
			ca.collaborator_id, \n\
			ca.object_id, \n\
			ca.step_id, \n\
			ast.order_number, \n\
			ams.order_number as main_step \n\
		from \n\
			cc_custom_adaptations ca \n\
		inner join ( \n\
			select ccas.* \n\
			from cc_adaptation_steps ccas \n\
			inner join ( \n\
				select \n\
					max(order_number) orn \n\
				from cc_adaptation_steps \n\
			) c on c.orn = ccas.order_number \n\
		) ast on ast.id = ca.step_id \n\
		inner join cc_adaptation_main_steps ams on ams.id = ca.main_step_id \n\
		where \n\
			ca.career_reserve_id = " + crid + " \n\
			and ams.id = " + mainStepId + " \n\
	"));
}

function getCurrentStep(crid){
	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			ca.id, \n\
			ca.collaborator_id, \n\
			ca.object_id, \n\
			ca.step_id, \n\
			ast.order_number, \n\
			ams.order_number as main_step, \n\
			ca.main_step_id \n\
		from \n\
			cc_custom_adaptations ca \n\
		inner join cc_adaptation_steps ast on ast.id = ca.step_id \n\
		inner join cc_adaptation_main_steps ams on ams.id = ca.main_step_id \n\
		where \n\
			ca.career_reserve_id = " + crid + " \n\
			and ca.is_active_step = 1 \n\
	"));
}

function getProcessSteps(role, stepId, action){
	return XQuery("sql: \n\
		select \n\
			ars.id, \n\
			ars.operation_id, \n\
			ars.next_step, \n\
			ars.role, \n\
			case \n\
			when ars.next_role is not null then ars.next_role \n\
			when ars.next_role is null then ars.role \n\
			end next_role, \n\
			ars.step, \n\
			ast.title step_title, \n\
			ns.code notification_code, \n\
			ast.order_number next_step_order_number \n\
		from \n\
			cc_adaptation_role_operations ars \n\
		inner join cc_adaptation_operations aps on aps.id = ars.operation_id \n\
		inner join cc_adaptation_steps ast on ast.id = ars.next_step \n\
		inner join notifications ns on ns.id = ars.notification_type \n\
		where \n\
			ars.role = '" + role + "' \n\
			and ars.step = " + stepId + " \n\
			and aps.name = '" + action + "' \n\
		order by ast.order_number asc \n\
	");
}