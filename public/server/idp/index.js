<%

var Utils = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/utils.js');
DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/utils.js');

var User = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/user.js');
DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/user.js');

var Dp = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/dp.js');
DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/dp.js');

var Task = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/task.js');
DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/task.js');

var Assessment = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/assessment.js');
DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/assessment.js');

var Step = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/step.js');
DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/idp/step.js');


var st = Utils.getSystemSettings(6790263731625424310);
var curUserID = OptInt(st.TopElem.cur_user_id);

//var curUserID = 6711785032659205612; // me test
//var curUserID = 6719948502038810952; // volkov test
//var curUserID = 6719947231785930663; // boss test
//var curUserID = 6719948119925684121; //baturin test
//var curUserID = 6719948507670014353; // hrbp test
//var curUserID = 6770996101418848653; // user test
//var curUserID = 6148914691236517121; // user prod
//var curUserID = 6605157354988654063; // пичугина prod

var curUser = OpenDoc(UrlFromDocID(curUserID)).TopElem;

function _setComputedFields(dpDoc) {
	var btypes = User.roles();

	function isAlowEditTasks(curStep, userRole){
		return (Int(curStep.next_collaborator_id) == curUserID || userRole == btypes.moderator);
	}

	function isTop() {
		var userDoc = OpenDoc(UrlFromDocID(curUserID));
		var pl = userDoc.TopElem.custom_elems.ObtainChildByKey('position_level').value;
		return (pl == '1' || pl == '2');
	}

	function isUser(dpDoc, userRole){
		return (dpDoc.TopElem.person_id == curUserID || userRole == btypes.moderator);
	}

	function isManager(userRole){
		//alert('isManager_userRole: ' + userRole);
		return (userRole == btypes.main || userRole == btypes.moderator);
	}

	function isAllowEditDp(_dpDoc, _curStep) {
		var lst = Step.getLastMainStep();
		var lstm = Step.getLastStepByMainStepId(_dpDoc.DocID, _curStep.idp_main_step_id);

		if (lstm == undefined) {
			return true;
		}

		if ((_curStep.idp_main_step_order_number == lst.order_number && _curStep.idp_step_order_number == lstm.idp_step_order_number)
			|| (lstm.idp_step_order_number == _curStep.idp_step_order_number)
		) {
			return false;
		}
		return true;
	}

	//alert('_1');
	var currentStep = Step.getCurrentStep(dpDoc.DocID);
	//alert('currentStep: ' + tools.object_to_text(currentStep, 'json'));
	//alert('curUserID: ' + curUserID);
	//alert('crdoc.DocID: ' + crdoc.DocID);
	//alert('g_1111111111111');
	var urole = User.getRole(curUserID, dpDoc.DocID, dpDoc);
	//alert('g_222222222222222');
	//alert('urole: ' + urole);
	//alert('_3');
	var isEditDp = isAllowEditDp(dpDoc, currentStep);
	//alert('isEditDp: ' + tools.object_to_text(isEditDp, 'json'));
	//alert('_6');
	var isEditTasks = isAlowEditTasks(currentStep, urole);
	//alert('isEditTasks: ' + tools.object_to_text(isEditTasks, 'json'));
	//alert('_7');
	//var ats = Dp.getAssessments();
	//alert('_9');
	var curMainStepNumber = currentStep.idp_main_step_order_number;
	//alert('curMainStepNumber: ' + curMainStepNumber);

	var uactions = User.getActionsByRole(urole, currentStep.idp_step_id);
	//alert('uactions:' + tools.object_to_text(uactions, 'json'));

	var _isUser = isUser(dpDoc, urole);
	//alert('_isUser: ' + _isUser);
	var _isManager = isManager(urole);
	var _isTop = isTop();
	/*alert('_isTop: ' + _isTop);
	alert('allow_edit_tasks: ' + ((_isTop && curMainStepNumber == 0) || (_isUser && (curMainStepNumber > 0))));
	alert('allow_add_tasks: ' + (_isTop && curMainStepNumber == 0));
	alert('allow_remove_tasks: ' + (_isTop && curMainStepNumber == 0));*/
	//alert('_isManager: ' + _isManager);

	return {
		actions: (curMainStepNumber > 0 ? uactions : []),
		is_show_assessments: isEditTasks && curMainStepNumber > 0,
		allow_add_themes: _isManager && (curMainStepNumber == 0),
		allow_edit_themes: _isManager && (curMainStepNumber == 0),
		allow_remove_themes: _isManager && (curMainStepNumber == 0),
		allow_edit_target: isEditTasks && isEditDp && curMainStepNumber == 0, // цель
		allow_edit_expected_result: isEditTasks && isEditDp && curMainStepNumber == 0, // ожидаемый результат
		allow_edit_achieved_result: isEditTasks && isEditDp && curMainStepNumber > 0 && _isUser, // Достигнутый результат
		allow_edit_tasks: (_isTop && curMainStepNumber == 0) || (_isUser && (curMainStepNumber > 0)),
		allow_add_tasks: _isTop && curMainStepNumber == 0,
		allow_remove_tasks: _isTop && curMainStepNumber == 0
	}
}


function get_Idps(queryObjects) {
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');
	var userId = queryObjects.GetOptProperty('user_id');
	userId = userId == undefined ? curUserID : userId;

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var dp = ArrayOptFirstElem(XQuery("sql: \n\
		select id \n\
		from development_plans \n\
		where \n\
			person_id = " + userId + " \n\
			and assessment_appraise_id = " + assessmentAppraiseId)
	);

	try {
		if (dp != undefined) {
			var card = Dp.getObject(dp.id, assessmentAppraiseId);
			var dpDoc = OpenDoc(UrlFromDocID(Int(dp.id)));
			var meta = _setComputedFields(dpDoc);
			return Utils.setSuccess({
				card: card,
				meta: meta
			});
		}

		return Utils.setError('Анкета не найдена');

	/*var dpId = queryObjects.GetOptProperty('development_plan_id');
	var isManager = Utils.toBoolean(queryObjects.GetOptProperty('is_manager'));

	try {
		if (dpId != undefined) {
			var card = Dp.getObject(dpId, assessmentAppraiseId, curUserID);
			var dpDoc = OpenDoc(UrlFromDocID(Int(dpId)));
			var meta = _setComputedFields(dpDoc);
			return Utils.setSuccess({
				card: card,
				meta: meta
			});
		} else if (isManager) {
			var search = queryObjects.HasProperty('search') ? queryObjects.search : '';
			var status = queryObjects.HasProperty('status') ? queryObjects.status : 0;
			var page = queryObjects.HasProperty('page') ? OptInt(queryObjects.page) : 1;
			var sort = queryObjects.HasProperty('sort') ? String(queryObjects.sort) : 'date';
			var sortDirection = queryObjects.HasProperty('sort_direction') ? String(queryObjects.sort_direction) : 'desc';
			var pageSize = 10;

			var min = (page - 1) * pageSize;
			var max = min + pageSize;

			var dpList = Dp.listByManager(
				assessmentAppraiseId,
				curUserID,
				search,
				status,
				min,
				max,
				pageSize,
				sort,
				sortDirection
			);
			return Utils.setSuccess(dpList);
		}

		return Utils.setSuccess(XQuery("sql: \n\
			select \n\
				dps.person_id, \n\
				dps.person_fullname, \n\
				dps.person_position_name, \n\
				ccims.development_plan_id, \n\
				ccims.create_date, \n\
				ccims.plan_date, \n\
				iss.id step_id, \n\
				iss.name step_name, \n\
				imss.id main_step_id, \n\
				imss.name main_step_name, \n\
				cciss.id state_id, \n\
				cciss.name state_name \n\
			from cc_idp_mains ccims \n\
			inner join cc_idp_main_flows imfs on imfs.idp_main_id = ccims.id \n\
			inner join cc_idp_main_steps imss on imss.id = imfs.idp_main_step_id \n\
			inner join cc_idp_steps iss on iss.id = imfs.idp_step_id \n\
			inner join cc_idp_states cciss on cciss.id = ccims.idp_state_id \n\
			inner join development_plans dps on dps.id = ccims.development_plan_id \n\
			where \n\
				dps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
				and dps.person_id = " + curUserID + " \n\
				and imfs.is_active_step = 1"
			)
		);*/	
	} catch(e) {
		return Utils.setError(e);
	}
}

function post_Meta(queryObjects) {
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');
	var dpId = queryObjects.GetOptProperty('dp_id');
	var data = tools.read_object(queryObjects.Body);
	var comps = data.GetOptProperty('competences');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	if (comps == undefined) {
		return Utils.setError('Неверные параметры');	
	} 

	var selected_items = [];
	if (dpId != undefined) {
		selected_items = XQuery("sql: \n\
			select \n\
				cs.id competence_id, \n\
				its.id theme_id \n\
			from cc_idp_competences ics \n\
			inner join competences cs on cs.id = ics.competence_id \n\
			inner join cc_idp_themes its on its.id = ics.idp_theme_id \n\
			where \n\
				ics.development_plan_id = " + dpId + " \n\
		")
	}

	/*var qs = ArrayOptFirstElem(XQuery("sql: \n\
		select ps.id \n\
		from \n\
			pas ps\n\
		where \n\
			ps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and ps.person_id = " + curUserID + " \n\
			and ps.expert_person_id <> " + curUserID + "\n\
			and ps.is_done = 1"
	));

	if (qs == undefined) {
		return Utils.setError('Не найдена завершенная анкета оценки');
	}*/
	var result = Dp.getThemesByCompetences(comps, assessmentAppraiseId);
	var commonScales = Assessment.getCommonScales();
	var taskTypes = Task.getTaskTypes();
	return Utils.setSuccess({
		competences: result,
		selected_items: selected_items,
		scales: commonScales,
		task_types: taskTypes
	});
}

function post_Idps(queryObjects) {
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var dpId = queryObjects.GetOptProperty('development_plan_id');
	var data = tools.read_object(queryObjects.Body);
	var comps = data.GetOptProperty('competences');

	if (dpId == undefined || dpId == 'undefined') {
		// create new
		try {
			if (!Dp.isAccessToAdd(curUserID)) {
				return Utils.setError('У вас нет прав на создание');
			}

			var dpDoc = Dp.create(curUserID, comps, assessmentAppraiseId);
			
			/*if (isNotificate != undefined && (isNotificate || isNotificate == 'true')) {
				Utils.notificate('idp_1', collaboratorId);

				var bossId = User.getBoss(collaboratorId);
				if (bossId != undefined) {
					Utils.notificate('idp_2', bossId, '', collaboratorId);
				}
			}*/
			return Utils.setSuccess(dpDoc);
		} catch(e) {
			return Utils.setError(e);
		}
	} else {
		//update
		Dp.update(dpId, comps, assessmentAppraiseId);
		return Utils.setSuccess({});
	}

	//update
	/*try {
		if (!Dp.isAccessToUpdate(assessmentId, curUserID)) {
			return Utils.setError('У вас нет прав на редактирование');
		}

		var aDoc = Dp.update(curUserID, dpId, competences);
		//alert('update topic: 2');
		return Utils.setSuccess(aDoc);
	} catch(e) {
		return Utils.setError(e);
	}*/
}


function post_changeStep(queryObjects){
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var dpid = queryObjects.HasProperty('development_plan_id') ? Trim(queryObjects.development_plan_id) : undefined;

	if (dpid == undefined){
		return Utils.toJSON(Utils.setError('Не указан план развития'));
	}

	var isAccess = Dp.isAccessToView(curUserID, null, dpid);
	if (!isAccess){
		return Utils.toJSON(Utils.setError('У вас нет доступа к этому документу'));
	}

	var data = tools.read_object(queryObjects.Body);
	var action = data.HasProperty('action') ? data.action : undefined;
	if (action == undefined) {
		return Utils.setError('Неверное количество аргументов');
	}

	var urole = User.getRole(curUserID, dpid);
	alert('post_changeStep__urole: ' + urole);
	var uactions = User.getActionsByRole(urole);
	alert('post_changeStep__uactions: ' + tools.object_to_text(uactions, 'json'));

	if (ArrayOptFind(uactions, 'This.code == \'' + action + '\'') == undefined) {
		return Utils.setError('Действие не найдено');
	}

	var currentStep = Step.getCurrentStep(dpid);
	var personFromRole = User.getRole(currentStep.next_collaborator_id, dpid);


	/*alert('personFromRole: ' + personFromRole);
	alert('currentStep.step_id: ' + currentStep.step_id);
	alert('action: ' + action);*/

	//Теперь функция getProcessSteps может вернуть несколько записей. 
	//Т.к. у  сотрудника может не быть куратора, и он должен отправить сразу руководителю.
	//Получаем этапы, сортируем по номеру
	var processSteps = Step.getProcessSteps(personFromRole, currentStep.idp_step_id, action);
	//alert('processSteps: ' + tools.object_to_text(processSteps, 'json'))
	
	if (ArrayCount(processSteps) == 0){
		return Utils.setError('Невозможно перевести на следующий этап. Возможно у вас нет рук-ля в штатном расписании.');
	}

	var processStep = null;
	var nextUserId = null;
	//alert('ArrayCount(processSteps): ' + (ArrayCount(processSteps)))
	for (ps in processSteps){
		nextUserId = Dp.getNextUserId(dpid, ps.next_idp_role_code);
		if (nextUserId != null){
			processStep = ps;
			break;
		}
	}

	//alert('processStep: ' + tools.object_to_text(processStep, 'json'))

	if (processStep == null || nextUserId == null){
		/*alert('processStep == null:' + (processStep == null));
		alert('nextUserId == null:' + (nextUserId == null));*/
		return Utils.toJSON(Utils.setError('Невозможно перевести на следующий этап.'));
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
	//var nextUserId = Adaptation.getNextUserId(crid, processStep.next_role);
	
	var step = null;
	var comment = data.HasProperty('comment') && data.GetOptProperty('comment') != 'undefined' ? data.comment : '';
	var nextStep = Step.create(
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

	return Utils.setSuccess({});
}

function post_Tasks(queryObjects){
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var taskId = queryObjects.GetOptProperty('task_id');
	var dpId = queryObjects.GetOptProperty('development_plan_id');
	var competenceId = queryObjects.GetOptProperty('competence_id');
	var data = tools.read_object(queryObjects.Body);
	var task = null;

	if (taskId != undefined) {
		if (!Task.isAccessToUpdate()) {
			return Utils.setError('У вас нет прав на редактирование');
		}

		task = Task.update(taskId, data);
		return Utils.setSuccess(Task.getObject(taskId));
		
	}

	if (!Task.isAccessToAdd(curUserID)) {
		return Utils.setError('У вас нет прав на создание');
	}

	if (dpId == undefined || competenceId == undefined) {
		return Utils.setError('Invalid parametres');
	}

	task = Task.create(dpId, competenceId, data);
	return Utils.setSuccess(Task.getObject(task.DocID));
}

function delete_Tasks(queryObjects){
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var taskId = queryObjects.GetOptProperty('task_id');
	if (taskId != undefined){
		if (!Task.isAccessToRemove()) {
			return Utils.setError('У вас нет прав на удаление');
		}

		Task.remove(taskId);
		return Utils.setSuccess({});
	}

	return Utils.setError('Invalid parametres');
}

function get_Collaborators(queryObjects) {
	var search = queryObjects.HasProperty('search') ? queryObjects.search : '';
	var page = queryObjects.HasProperty('page') ? OptInt(queryObjects.page) : 1;
	var pageSize = queryObjects.HasProperty('page_size') ? OptInt(queryObjects.page_size) : 10;

	var min = (page - 1) * pageSize;
	var max = min + pageSize;
	
	var q = XQuery("sql: \n\
		declare @s varchar(max) = '" + search + "'; \n\
		select d.* \n\
		from ( \n\
			select \n\
				count(cs.id) over() total, \n\
				ROW_NUMBER() OVER (ORDER BY cs.fullname) AS [row_number], \n\
				cs.id, \n\
				cs.fullname name, \n\
				cs.position_name description, \n\
				cs.code, \n\
				cs.hire_date, \n\
				cs.dismiss_date, \n\
				cs.pict_url \n\
			from collaborators cs \n\
			where \n\
			    cs.is_dismiss = 0 \n\
			    and cs.id <> " + curUserID + " \n\
			    and cs.fullname like '%'+@s+'%' \n\
			    and cs.position_name not in ('Агент (ЮЛ)', 'Агент (ИП)', 'Агент (ФЛ)') \n\
		) d \n\
		where \n\
			d.[row_number] > " + min + " and d.[row_number] <= " + max + " \n\
		order by d.name asc \n\
	");

	var total = 0;
	var fobj = ArrayOptFirstElem(q);
	if (fobj != undefined) {
		total = fobj.total;
	}

	var obj = {
		meta: {
			total: Int(total),
			pageSize: pageSize,
			page: page
		},
		collaborators: q
	}

	return Utils.setSuccess(obj);
}

%>