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


var st = Utils.getSystemSettings(6790263731625424310);
var curUserID = 6711785032659205612; //OptInt(st.TopElem.cur_user_id);

//var curUserID = 6711785032659205612; // me test
//var curUserID = 6719948502038810952; // volkov test
//var curUserID = 6719947231785930663; // boss test
//var curUserID = 6719948119925684121; //baturin test
//var curUserID = 6719948507670014353; // hrbp test
//var curUserID = 6770996101418848653; // user test
//var curUserID = 6148914691236517121; // user prod
//var curUserID = 6605157354988654063; // пичугина prod

var curUser = OpenDoc(UrlFromDocID(curUserID)).TopElem;


function get_Idps(queryObjects) {
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var dpId = queryObjects.GetOptProperty('development_plan_id');
	var isManager = Utils.toBoolean(queryObjects.GetOptProperty('is_manager'));
	var dpObj = {};

	try {
		if (dpId != undefined) {
			var userRole = User.getRole(curUserID, dpId);
			dpObj = Dp.getObject(dpId, assessmentAppraiseId, curUserID);
			return Utils.setSuccess(dpObj);
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
				ccimss.id main_step_id, \n\
				ccimss.name main_step_name, \n\
				cciss.id state_id, \n\
				cciss.name state_name \n\
			from cc_idp_mains ccims \n\
			inner join cc_idp_main_steps ccimss on ccimss.id = ccims.idp_main_step_id \n\
			inner join cc_idp_states cciss on cciss.id = ccims.idp_state_id \n\
			inner join development_plans dps on dps.id = ccims.development_plan_id \n\
			where \n\
				dps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
				and dps.person_id = " + curUserID)
		);	
	} catch(e) {
		return Utils.setError(e);
	}
}

function get_Meta(queryObjects) {
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var qs = ArrayOptFirstElem(XQuery("sql: \n\
		select ps.id \n\
		from \n\
			pas ps\n\
		where \n\
			ps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and ps.person_id = " + curUserID + " \n\
			and ps.expert_person_id <> " + curUserID + "\n\
			and ps.is_done = 1"
	));

	alert("sql: \n\
		select ps.id \n\
		from \n\
			pas ps\n\
		where \n\
			ps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and ps.person_id = " + curUserID + " \n\
			and ps.expert_person_id <> " + curUserID + "\n\
			and ps.is_done = 1");

	if (qs == undefined) {
		return Utils.setError('Не найдена завершенная анкета оценки');
	}

	var result = Dp.getCompetencesAndThemes(qs.id, assessmentAppraiseId);
	var commonScales = Assessment.getCommonScales();
	var taskTypes = Task.getTaskTypes();
	return Utils.setSuccess({
		competences: result,
		scales: commonScales,
		task_types: taskTypes
	});
}

function post_Idps(queryObjects) {
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var dpId = queryObjects.GetOptProperty('id');
	var data = tools.read_object(queryObjects.Body);
	var comps = data.GetOptProperty('competences');

	// create new
	if (dpId == undefined || dpId == 'undefined') {
		try {
			if (!Dp.isAccessToAdd(curUserID)) {
				return Utils.setError('У вас нет прав на создание');
			}

			var dpDoc = Dp.create(curUserID, comps);
			
			if (isNotificate != undefined && (isNotificate || isNotificate == 'true')) {
				Utils.notificate('idp_1', collaboratorId);

				var bossId = User.getBoss(collaboratorId);
				if (bossId != undefined) {
					Utils.notificate('idp_2', bossId, '', collaboratorId);
				}
			}
			return Utils.setSuccess(aDoc);
		} catch(e) {
			return Utils.setError(e);
		}
	}

	//update
	try {
		if (!Dp.isAccessToUpdate(assessmentId, curUserID)) {
			return Utils.setError('У вас нет прав на редактирование');
		}

		var aDoc = Dp.update(curUserID, dpId, competences);
		//alert('update topic: 2');
		return Utils.setSuccess(aDoc);
	} catch(e) {
		return Utils.setError(e);
	}
}


function post_taskChangeStep(queryObjects){
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var crid = queryObjects.HasProperty('cr_id') ? Trim(queryObjects.cr_id) : undefined;

	if (crid == undefined){
		return Utils.toJSON(Utils.setError('Invalid parametres'));
	}

	var isAccess = Adaptation.isAccessToView(curUserID, null, crid);
	if (!isAccess){
		return Utils.toJSON(Utils.setError('You don`t have permissions to this document'));
	}

	var data = tools.read_object(queryObjects.Body);
	var action = data.HasProperty('action') ? data.action : undefined;
	if (action == undefined){
		return Utils.setError('Invalid parametres');
	}

	var urole = User.getRole(curUserID, crid);
	var uactions = User.getActionsByRole(urole);

	if (ArrayOptFind(uactions, 'This.name == \'' + action + '\'') == undefined) {
		return Utils.setError('Unknown action for user');
	}

	var currentStep = Adaptation.getCurrentStep(crid);
	var personFromRole = User.getRole(currentStep.object_id, crid);


	/*alert('personFromRole: ' + personFromRole);
	alert('currentStep.step_id: ' + currentStep.step_id);
	alert('action: ' + action);*/

	//Теперь функция getProcessSteps может вернуть несколько записей. 
	//Т.к. у  сотрудника может не быть куратора, и он должен отправить сразу руководителю.
	//Получаем этапы, ранжируем по номеру
	var processSteps = Adaptation.getProcessSteps(personFromRole, currentStep.step_id, action);
	//alert('processSteps: ' + tools.object_to_text(processSteps, 'json'))
	
	if (ArrayCount(processSteps) == 0){
		return Utils.setError('Next step not found');
	}

	var processStep = null;
	var nextUserId = null;
	//alert('ArrayCount(processSteps): ' + (ArrayCount(processSteps)))
	for (ps in processSteps){
		nextUserId = Adaptation.getNextUserId(crid, ps.next_role);
		if (nextUserId != null){
			processStep = ps;
			break;
		}
	}

	//alert('processStep: ' + tools.object_to_text(processStep, 'json'))

	if (processStep == null || nextUserId == null){
		/*alert('processStep == null:' + (processStep == null));
		alert('nextUserId == null:' + (nextUserId == null));*/
		return Utils.toJSON(Utils.setError('Next step or next user not found'));
	}

	// если этап(общий) последний и не заполнены оценки рук-ля / сотрудника,
	// и если сотрудник пытается отправить дальше по этапу (верх по лесенке), то возвращаем ошибку
	var lst = Adaptation.getLastMainStep();
	var crDoc = OpenDoc(UrlFromDocID(Int(crid)));
	if (currentStep.main_step == lst.order_number && (OptInt(processStep.next_step_order_number) > OptInt(currentStep.order_number))) {
		//alert('11111');
		var assessmentsCount = ArrayOptFirstElem(XQuery("sql: \n\
			select \n\
				top 1 \n\
				count(ccat.id) over() total, \n\
				(select count(*) \n\
				from cc_adaptation_tasks \n\
				where \n\
					ccat.career_reserve_id = " + crid + " \n\
					and collaborator_assessment is not null \n\
				) collaborator_assessment, \n\
				(select count(*) \n\
				from cc_adaptation_tasks \n\
				where \n\
					ccat.career_reserve_id = " + crid + " \n\
					and manager_assessment is not null \n\
				) manager_assessment \n\
			from \n\
				cc_adaptation_tasks ccat \n\
			where ccat.career_reserve_id = " + crid + " \n\
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
	}


	var currentUserId = currentStep.object_id;
	//var nextUserId = Adaptation.getNextUserId(crid, processStep.next_role);
	
	var step = null;
	var comment = data.HasProperty('comment') && data.GetOptProperty('comment') != 'undefined' ? data.comment : '';
	var nextStep = Adaptation.createStep(
		currentStep.id,
		{
			collaborator_id: currentUserId,
			object_id: nextUserId,
			data: comment,
			step_id: processStep.next_step
		}
	);


	/* отправка уведомлений
		1. Если этап идет вверх, то отсылаем уведомление на кого переведен этап, и остальным вниз по лесенке ролей относительно того, кто перевел.
		2. Если этап идет вниз, то отсылаем всем вниз по лесенке ролей относительно того, кто перевел.
	*/

	var curUserRole = User.getRoleRecordByUserId(currentUserId, crid);
	var nextUserRole = User.getRoleRecordByUserId(nextUserId, crid);

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
			crid: OptInt(crid),
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
			Utils.notificate(processStep.notification_code, el, objToNotificate, crid);
		}
	}

	return Utils.setSuccess({});
}

function post_Task(queryObjects){
	var assessmentAppraiseId = queryObjects.GetOptProperty('assessment_appraise_id');

	if (assessmentAppraiseId == undefined) {
		return Utils.setError('Не указана процедура оценки');
	}

	var taskId = queryObjects.GetOptProperty('task_id');
	var data = tools.read_object(queryObjects.Body);
	var dpId = data.GetOptProperty('dp_id');
	var task = null;

	if (taskId != undefined) {
		if (!Task.isAccessToUpdate()) {
			return Utils.setError('У вас нет прав на редактирование');
		}

		task = Task.update(taskId, data);
		return Utils.setSuccess(task);
		
	}

	if (!Task.isAccessToAdd()) {
		return Utils.setError('У вас нет прав на создание');
	}

	if (dpId == undefined) {
		return Utils.setError('Invalid parametres');
	}

	task = Task.create(dpId, data);
	return Utils.setSuccess(task);
}

function delete_Task(queryObjects){
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
		return Utils.setSuccess();
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
					cs.pict_url, \n\
					cast(t.p.query(' \n\
						for $PD in  /collaborator/path_subs/path_sub \n\
							return concat(data($PD/name[1]), \" / \") \n\
						') as varchar(max) \n\
					) as structure \n\
				from collaborators cs \n\
				inner join collaborator c on c.id = cs.id \n\
				cross apply c.data.nodes('/collaborator/path_subs') as t(p) \n\
				where \n\
				    cs.is_dismiss = 0 \n\
				    and cs.id <> " + curUserID + " \n\
				    and cs.fullname like '%'+@s+'%' \n\
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