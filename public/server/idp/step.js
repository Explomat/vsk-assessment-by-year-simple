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
	var psq = "sql: \n\
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
	";

	return XQuery(psq);
}

function nextStep(curUserID, dpid, action, comment) {
	var User = OpenCodeLib('./user.js');
	DropFormsCache('./user.js');

	var Dp = OpenCodeLib('./dp.js');
	DropFormsCache('./dp.js');

	var urole = User.getRole(curUserID, dpid);
	var uactions = User.getActionsByRole(urole);
	//alert('nextStep_urole: ' + urole);
	//alert('nextStep_uactions: ' + tools.object_to_text(uactions, 'json'));

	if (ArrayOptFind(uactions, 'This.code == \'' + action + '\'') == undefined) {
		throw 'Действие не найдено';
	}

	var currentStep = getCurrentStep(dpid);
	var personFromRole = User.getRole(currentStep.next_collaborator_id, dpid);

	//Теперь функция getProcessSteps может вернуть несколько записей. 
	//Т.к. у  сотрудника может не быть куратора, и он должен отправить сразу руководителю.
	//Получаем этапы, сортируем по номеру
	var processSteps = getProcessSteps(personFromRole, currentStep.idp_step_id, action);
	/*alert('nextStep_currentStep: ' + tools.object_to_text(currentStep, 'json'));
	alert('nextStep_personFromRole: ' + String(personFromRole));
	alert('nextStep_action: ' + String(action));
	alert('nextStep_processSteps: ' + tools.object_to_text(processSteps, 'json'))*/
	
	if (ArrayCount(processSteps) == 0) {
		throw 'Невозможно перевести на следующий этап. Возможно у вас нет рук-ля в штатном расписании.';
	}

	var processStep = null;
	var nextUserId = null;
	//alert('ArrayCount(processSteps): ' + (ArrayCount(processSteps)))
	for (ps in processSteps) {
		nextUserId = Dp.getNextUserId(dpid, ps.next_idp_role_code);
		if (nextUserId != null) {
			processStep = ps;
			break;
		}
	}

	//alert('processStep: ' + tools.object_to_text(processStep, 'json'))

	if (processStep == null || nextUserId == null){
		/*alert('processStep == null:' + (processStep == null));
		alert('nextUserId == null:' + (nextUserId == null));*/
		throw 'Невозможно перевести на следующий этап.';
	}

	// если этап(общий) последний и не заполнены оценки рук-ля / сотрудника,
	// и если сотрудник пытается отправить дальше по этапу (вверх по лесенке), то возвращаем ошибку
	/*var lst = Step.getLastMainStep();
	var crDoc = OpenDoc(UrlFromDocID(Int(dpid)));
	if (currentStep.idp_main_step_order_number == lst.order_number && (OptInt(processStep.next_step_order_number) > OptInt(currentStep.idp_step_order_number))) {
		//alert('11111');
		var assessmentsCount = ArrayOptFirstElem(XQuery("sql: \n\
			select \n\
				top 1 \n\
				count(ccat.id) over() total, \n\
				(select count(*) \n\
				from cc_adaptation_tasks \n\
				where \n\
					ccat.career_reserve_id = " + dpid + " \n\
					and collaborator_assessment is not null \n\
				) collaborator_assessment, \n\
				(select count(*) \n\
				from cc_adaptation_tasks \n\
				where \n\
					ccat.career_reserve_id = " + dpid + " \n\
					and manager_assessment is not null \n\
				) manager_assessment \n\
			from \n\
				cc_adaptation_tasks ccat \n\
			where ccat.career_reserve_id = " + dpid + " \n\
		"));

		if (assessmentsCount != undefined) {
			//alert('222222');
			var c =
				isManager(urole) ?
					OptInt(assessmentsCount.manager_assessment) :
					(isUser(crDoc, urole) ?
						OptInt(assessmentsCount.collaborator_assessment) :
						OptInt(assessmentsCount.total));
			//alert('c:' + c);
			//alert('OptInt(assessmentsCount.total): ' + OptInt(assessmentsCount.total));
			if (OptInt(assessmentsCount.total) > c) {
				//alert('33333');
				return Utils.setError('Проставьте в задачах ваши оценки пожалуйста');
			}
		}
	}*/


	var currentUserId = currentStep.next_collaborator_id;
	
	var step = null;
	var nextStep = create(
		currentStep.id,
		{
			current_collaborator_id: currentUserId,
			next_collaborator_id: nextUserId,
			comment: comment,
			idp_step_id: processStep.next_idp_step_id
		}
	);

		/* отправка уведомлений
		1. Если этап идет вверх, то отсылаем уведомление на кого переведен этап, и остальным вниз по лесенке ролей относительно того, кто перевел.
		2. Если этап идет вниз, то отсылаем всем вниз по лесенке ролей относительно того, кто перевел.
	*/

	/*var curUserRole = User.getRoleRecordByUserId(currentUserId, dpid);
	var nextUserRole = User.getRoleRecordByUserId(nextUserId, dpid);

	//alert('curUserRole: ' + tools.object_to_text(curUserRole, 'json'));
	//alert('nextUserRole: ' + tools.object_to_text(nextUserRole, 'json'));

	if (curUserRole != undefined && nextUserRole != undefined) {
		//alert(1);
		var managerTypes = [];
		// если порядковый номер следующего этапа больше текущего, значит лесенка вверх
		if (OptInt(processStep.next_step_order_number) > OptInt(currentStep.order_number)) {
			//alert(2)
			managerTypes = User.getNextManagerTypes(OptInt(curUserRole.order_number), OptInt(nextUserRole.order_number));
		} else {
			//alert(3)
			managerTypes = User.getPrevManagerTypes(OptInt(nextUserRole.order_number));
		}

		//alert('ArrayCount(managerTypes):' + ArrayCount(managerTypes));
		var _tutors = [];
		//var crDoc = OpenDoc(UrlFromDocID(Int(crid)));
		for (mt in managerTypes) {
			for (el in crDoc.TopElem.tutors) {
				if (mt.boss_type_id == el.boss_type_id) {
					_tutors.push(el.person_id);
				}
			}
		}

		// Сотрудник, кто прохоит адаптацию должен всегда получать уведомления, если не он отправляет на согласование
		if (Int(crDoc.TopElem.person_id) != Int(currentUserId)) {
			_tutors.push(crDoc.TopElem.person_id);
		}

		//alert('ArrayCount(_tutors):' + ArrayCount(_tutors));
		var curUserDoc = OpenDoc(UrlFromDocID(Int(currentUserId)));
		var nextUserDoc = OpenDoc(UrlFromDocID(Int(nextUserId)));
		var _person = crDoc.TopElem.person_id.ForeignElem;

		var objToNotificate = tools.object_to_text({
			subject: ('Адаптация сотрудника ' + String(_person.fullname) + '. ' + String(nextStep.TopElem.main_step_id.ForeignElem.description) + ' / ' + String(processStep.step_title)),
			dpid: OptInt(dpid),
			stepTitle: String(processStep.step_title),
			from: {
				fullname: curUserDoc.TopElem.fullname,
				role: String(curUserRole.user_role_title)
			},
			to: {
				fullname: nextUserDoc.TopElem.fullname,
				role: String(nextUserRole.user_role_title)
			}
		}, 'json');

		for (el in _tutors) {
			Utils.notificate(processStep.notification_code, el, objToNotificate, dpid);
		}
	}*/

	return nextStep;
}