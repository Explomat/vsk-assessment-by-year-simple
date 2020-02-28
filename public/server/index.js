<%
	
	//alert('-----------------index.js---------------------');

	var Utils = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/utils.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/utils.js');

	var Report = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/report.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/report.js');

	//var curUserID = 6711785032659205612; // me test
	//var curUserID = 6770996101418848653; // user test

	//var curUserID = 6148914691236517121; // user prod

	//var curUserID = 6605157354988654063; // пичугина prod

	/*var rules = [
	{
		scale: 'E',
		color: '#f57b7b',
		description: 'Компетенция не проявляется в поведении / преобладают только негативные проявления',
		percent: 10
	},
	{
		scale: 'D',
		color: '#f8a2a2',
		description: 'Положительно проявляются отдельно элементы компетенции, а остальные требуют развития',
		percent: 20
	},
	{
		scale: 'C',
		color: '#ffcc6e',
		description: 'Компетенция проявлена в полной мере. Сотрудник успешно применяет компетенцию в стандартных рабочих ситуациях',
		percent: 30
	},
	{
		scale: 'B',
		color: '#abdfab',
		description: 'Проявление компетенции превосходит ожидания. Компетенция успешно применяется не только в стандартных, но и в новых ситуациях',
		percent: 40
	},
	{
		scale: 'A',
		color: '#79d879',
		description: 'Проявление компетенции существенно превосходит ожидания. Поведение сотрудника является примером для других',
		percent: 50
	}
	]*/

	function get_UiStep(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;

		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		var pa = ArrayOptFirstElem(XQuery("sql: \n\
			select \n\
				count(*) c \n\
			from pas \n\
			where \n\
				pas.assessment_appraise_id = " + assessmentAppraiseId + " \n\
				and pas.person_id = " + curUserID 
		));

		var step = pa.c == 0 ? bsettings.steps.first : bsettings.steps.second;

		return tools.object_to_text({ step: step }, 'json');
	}

	function get_Collaborators(queryObjects) {
		var search = queryObjects.HasProperty('search') ? Trim(queryObjects.search) : '';

		var colls = XQuery("sql: \n\
			select \n\
				TOP 5 \n\
				col.id, \n\
				col.fullname as title, \n\
				col.position_name as position, \n\
				col.position_parent_name as department, \n\
				(col.position_parent_name + ' -> ' + col.position_name) as description \n\
			from \n\
				collaborators as col \n\
			where \n\
				col.is_dismiss = 0 \n\
				and col.id <> " + curUserID + " \n\
				and col.fullname LIKE ('%" + search + "%') \n\
		");

		var objs = [];
		for (el in colls) {
			objs.push({
				id: Int(el.id),
				title: String(el.title),
				position: String(el.position),
				department: String(el.department),
				description: String(el.description)
			});
		}

		return tools.object_to_text(objs, 'json');
	}

	function createInitialProfile(assessmentAppraiseId){

		var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
		DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
		var bsettings = Settings.baseSettings(assessmentAppraiseId);

		/*var data = tools.read_object(queryObjects.Body);
		var manager = data.HasProperty('manager') ? data.manager : null;
		var status = data.HasProperty('status') ? data.status : '';
		
		var profileId = (status == 'user' ? USER_COMPETENCE_PROFILE_ID : BOSS_COMPETENCE_PROFILE_ID);
		var profileCompetences = OpenDoc(UrlFromDocID(profileId)).TopElem.competences;*/


		var curUser = Utils.getBossById(curUserID);
		//alert('createInitialProfile_1');
		var isBoss = curUser == undefined ? false : true;
		//alert('createInitialProfile_2');

		var profileId = isBoss ? bsettings.GetOptProperty('manager_competence_profile_id') : bsettings.GetOptProperty('self_competence_profile_id');
		//alert('createInitialProfile_3');

		//alert('bsettings:' + tools.object_to_text(bsettings, 'json'));


		//alert('createInitialProfile_profileId: ' + profileId);
		if (profileId == undefined) {
			//alert('createInitialProfile_4');
			throw 'Не найден профиль вашей оценки.';
		}

		var profileCompetences = OpenDoc(UrlFromDocID(profileId)).TopElem.competences;
		//alert('createInitialProfile_5');
		var userBoss = Utils.getUserBoss(curUserID);
		//alert('createInitialProfile_6');
		var userBossId = userBoss != undefined ? userBoss.person_id : null;
		//alert('createInitialProfile_7');

		//план оценки
		var docPlan = tools.new_doc_by_name('assessment_plan');
		docPlan.TopElem.assessment_appraise_id = bsettings.assessment_appraise_id;
		docPlan.TopElem.boss_id = userBossId;
		docPlan.TopElem.workflow_id = bsettings.workflow_id;
		docPlan.TopElem.workflow_state = 1;
		docPlan.TopElem.person_id = curUserID;
		docPlan.BindToDb(DefaultDb);
		docPlan.Save();

		//alert('createInitialProfile_8');

		//самооценка
		var docSelf = tools.new_doc_by_name('pa');
		docSelf.TopElem.assessment_appraise_type = 'competence_appraisal';
		docSelf.TopElem.competence_profile_id = profileId;
		docSelf.TopElem.status = 'self';
		docSelf.TopElem.assessment_appraise_id = bsettings.assessment_appraise_id;
		docSelf.TopElem.workflow_id = bsettings.workflow_id;
		docSelf.TopElem.workflow_state = 1;
		docSelf.TopElem.person_id = curUserID;
		docSelf.TopElem.expert_person_id = curUserID;
		docSelf.TopElem.competences.AssignElem(profileCompetences);
		docSelf.TopElem.assessment_plan_id = docPlan.DocID;
		docSelf.BindToDb(DefaultDb);
		docSelf.Save();
		//alert('createInitialProfile_8');

		var objToSend = tools.object_to_text({
			assessmentAppraiseId: assessmentAppraiseId
		}, 'json');

		/*if (userBossId != null) {
			Utils.notificate('oc_1', userBossId, curUserID, objToSend);
		}*/
	}

	function get_ProfileData(queryObjects){
		//alert('get_ProfileData');

		var userID = queryObjects.HasProperty('user_id') ? Trim(queryObjects.user_id) : curUserID;
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		//alert('111111111111111111');

		try {
			if (assessmentAppraiseId == null) {
				throw 'Не указана процедура оценки';
			}

			//alert('2222222222222222222222');
			var isPa = Utils.isUserHasPa(userID, assessmentAppraiseId);
			//alert('33333333333333333333');
			if (isPa == false) {
				//alert('4444444444444444444444');
				createInitialProfile(assessmentAppraiseId);
			}

			//alert('555555555555555555555555555');

			var userData = Utils.user(userID, assessmentAppraiseId);
			var instruction = Utils.instruction(assessmentAppraiseId);
			var managerData = Utils.managerForUser(userID, assessmentAppraiseId);
			var planData = Utils.assessmentPlanForUser(userID, assessmentAppraiseId);
			var pasData = Utils.pasForUser(userID, undefined, assessmentAppraiseId);
			var subordinatesData = Utils.subordinatesForUser(userID, assessmentAppraiseId);
			var commonCompetencesData = Utils.commonCompetences(userID, assessmentAppraiseId);
			var _rules = Utils.docWvars(queryObjects.DocID);

			if (managerData != undefined){
				userData.manager = {
					id: String(managerData.id),
					fullname: String(managerData.fullname),
					position: String(managerData.position),
					department: String(managerData.department)
				}
			} else {
				userData.manager = {};
			}  

			if (planData != undefined){
				var aapDoc = OpenDoc(UrlFromDocID(Int(assessmentAppraiseId)));

				userData.assessment = {
					name: String(aapDoc.TopElem.name),
					step: String(planData.step),
					startDate: StrXmlDate(Date(aapDoc.TopElem.start_date)),
					finishDate: StrXmlDate(Date(aapDoc.TopElem.end_date)),
					stepName: String(planData.stepName),
					overall: String(planData.overall),
					pas: pasData
				}
			} else {
				userData.assessment = {}
			}

			userData.subordinates = subordinatesData;

			return tools.object_to_text({
				meta: {
					curUserID: curUserID
				},
				instruction: String(instruction),
				user: userData,
				commonCompetences: commonCompetencesData,
				rules: _rules
			}, 'json');
		} catch(e) {
			return tools.object_to_text({
				error: String(e)
			}, 'json');
		}
	}

	function get_Instruction(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		var instruction = Utils.instruction(assessmentAppraiseId);
		return tools.object_to_text({
			instruction: String(instruction)
		}, 'json');
	}

	function get_SubordinateData(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		var userID = queryObjects.HasProperty('user_id') ? Trim(queryObjects.user_id) : curUserID;

		var userData = Utils.user(userID, assessmentAppraiseId);
		var instruction = Utils.instruction(assessmentAppraiseId);
		var managerData = Utils.managerForUser(userID, assessmentAppraiseId);
		var planData = Utils.assessmentPlanForUser(userID, assessmentAppraiseId);
		//var pasData = Utils.pasForUser(userID, 'manager');
		var pasData = Utils.pasForUser(userID, undefined, assessmentAppraiseId);
		var commonCompetencesData = Utils.commonCompetences(userID, assessmentAppraiseId);
		var _rules = Utils.docWvars(queryObjects.DocID);

		if (managerData != undefined){
			userData.manager = {
				id: String(managerData.id),
				fullname: String(managerData.fullname),
				position: String(managerData.position),
				department: String(managerData.department)
			}
		} else {
			userData.manager = {};
		}  

		if (planData != undefined){
			var aapDoc = OpenDoc(UrlFromDocID(Int(assessmentAppraiseId)));

			userData.assessment = {
				name: String(aapDoc.TopElem.name),
				step: String(planData.step),
				startDate: StrXmlDate(Date(aapDoc.TopElem.start_date)),
				finishDate: StrXmlDate(Date(aapDoc.TopElem.end_date)),
				stepName: String(planData.stepName),
				overall: String(planData.overall),
				pas: pasData
			}
		} else {
			userData.assessment = {}
		}

		return tools.object_to_text({
			meta: {
				curUserID: curUserID
			},
			instruction: String(instruction),
			user: userData,
			commonCompetences: commonCompetencesData,
			rules: _rules
		}, 'json');
	}

	function post_FourthStep(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		//var data = tools.read_object(queryObjects.Body);
		//var answer = data.HasProperty('answer') ? Trim(data.answer) : '';

		//var comment = (answer == 'false' ? 'Не согласен с результатом' : 'Согласен с результатом');

		var q = ArrayOptFirstElem(XQuery("sql: \n\
			select pas.id \n\
			from \n\
				pas \n\
			where \n\
				pas.assessment_appraise_id = " + assessmentAppraiseId + " \n\
				and pas.person_id = " + curUserID + " \n\
				and pas.expert_person_id = " + curUserID
		));
		if (q != undefined){
			try {
				var paCard = OpenDoc(UrlFromDocID(Int(q.id)));
				paCard.TopElem.is_done = true;
				//paCard.TopElem.comment = comment;
				paCard.TopElem.workflow_state = 4;
				paCard.TopElem.workflow_state_name = 'Оценка завершена';
				paCard.Save();

				var docPlan = OpenDoc(UrlFromDocID(paCard.TopElem.assessment_plan_id));
				docPlan.TopElem.workflow_state = 4;
				docPlan.TopElem.is_done = true;
				docPlan.Save();


				var bossId = Utils.assessmentBossByUser(curUserID, assessmentAppraiseId);

				if (bossId != undefined){
					var objToSend = tools.object_to_text({
						assessmentAppraiseId: assessmentAppraiseId
					}, 'json');
					Utils.notificate('oc_4', bossId, curUserID, objToSend);

					objToSend = tools.object_to_text({
						assessmentAppraiseId: assessmentAppraiseId
					}, 'json');
					Utils.notificate('oc_5', curUserID, bossId, objToSend);
				}

				return tools.object_to_text({ step: 4 }, 'json');
			} catch (e) {
				return tools.object_to_text({ status: 'error: ' + e }, 'json');
			}
		}
	}

	function post_ThirdStep(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		var data = tools.read_object(queryObjects.Body);
		var paId = data.HasProperty('id') ? data.id : null;
		var overall = data.HasProperty('overall') ? data.overall : '';
		var _competences = data.HasProperty('competences') ? data.competences : null;

		var curPaCard = OpenDoc(UrlFromDocID(Int(paId)));
		for (elem in _competences) {
			comp = ArrayOptFind(curPaCard.TopElem.competences, 'This.competence_id == ' + elem.competence_id);
			if (comp != undefined) {
				comp.mark_value = elem.mark_value;
				comp.mark_text = elem.mark_text;
				comp.comment = elem.comment;
				for (indicator in elem.indicators) {
					ind = ArrayOptFind(comp.indicators, 'This.indicator_id == ' + indicator.indicator_id);
					if (ind != undefined) {
						ind.mark_value = indicator.mark_value;
						ind.mark_text = indicator.mark_text;
						ind.comment = indicator.comment;
					}
				}
			}
		}

		curPaCard.TopElem.overall = overall;
		curPaCard.TopElem.workflow_state = 3;
		curPaCard.TopElem.workflow_state_name = 'Ознакомление сотрудника';
		curPaCard.Save();

		var docPlan = OpenDoc(UrlFromDocID(curPaCard.TopElem.assessment_plan_id));
		docPlan.TopElem.workflow_state = 3;
		docPlan.Save();

		var objToSend = tools.object_to_text({
			assessmentAppraiseId: assessmentAppraiseId
		}, 'json');
		Utils.notificate('oc_3', curPaCard.TopElem.person_id, curUserID, objToSend);
		return tools.object_to_text({
			step: 3
		}, 'json');
	}

	function post_SecondStep(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}


		var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
		DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
		var bsettings = Settings.baseSettings(assessmentAppraiseId);

		var data = tools.read_object(queryObjects.Body);
		var paId = data.HasProperty('id') ? data.id : null;
		var overall = data.HasProperty('overall') ? data.overall : '';
		var _competences = data.HasProperty('competences') ? data.competences : null;

		// type 2 типов user и boss ( кто сохраняет)

		//оценка руководителя
		var docPaUser = OpenDoc(UrlFromDocID(Int(paId)));
		var profileId = docPaUser.TopElem.competence_profile_id;
		var profileCompetences = OpenDoc(UrlFromDocID(profileId)).TopElem.competences;

		var docPlan = OpenDoc(UrlFromDocID(docPaUser.TopElem.assessment_plan_id));
		docPlan.TopElem.workflow_state = 2;
		docPlan.Save();

		var docManager = tools.new_doc_by_name('pa');
		docManager.TopElem.assessment_appraise_type = 'competence_appraisal';
		docManager.TopElem.competence_profile_id = profileId;
		docManager.TopElem.status = 'manager';
		docManager.TopElem.assessment_appraise_id = bsettings.assessment_appraise_id;
		docManager.TopElem.workflow_id = bsettings.workflow_id;
		docManager.TopElem.workflow_state = 2;
		docManager.TopElem.person_id = curUserID;
		docManager.TopElem.expert_person_id = docPlan.TopElem.boss_id;
		docManager.TopElem.competences.AssignElem(profileCompetences);
		docManager.TopElem.assessment_plan_id = docPlan.DocID;
		docManager.BindToDb(DefaultDb);
		docManager.Save();

		try {
			curPaCard = OpenDoc(UrlFromDocID(Int(paId)));
			for (elem in _competences) {
				comp = ArrayOptFind(curPaCard.TopElem.competences, 'This.competence_id == ' + elem.competence_id);
				if (comp != undefined) {
					comp.mark_value = elem.mark_value;
					comp.mark_text = elem.mark_text;
					comp.comment = elem.comment;
					for (indicator in elem.indicators) {
						ind = ArrayOptFind(comp.indicators, 'This.indicator_id == ' + indicator.indicator_id);
						if (ind != undefined) {
							ind.mark_value = indicator.mark_value;
							ind.mark_text = indicator.mark_text;
							ind.comment = indicator.comment;
						}
					}
				}
			}

			curPaCard.TopElem.overall = overall;
			curPaCard.TopElem.workflow_state = 2;
			curPaCard.TopElem.workflow_state_name = 'Оценка руководителя';
			curPaCard.Save();

			var objToSend = tools.object_to_text({
				assessmentAppraiseId: assessmentAppraiseId
			}, 'json');
			Utils.notificate('oc_2', docPlan.TopElem.boss_id, curUserID, objToSend);
		} catch(e){ alert(e); }

		return tools.object_to_text({
			step: 2
		}, 'json');
	}

	function post_ResetManager(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
		DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
		var bsettings = Settings.baseSettings(assessmentAppraiseId);


		var q = XQuery("sql: \n\
			select p.id \n\
			from \n\
				pas p \n\
			where \n\
				p.person_id = " + curUserID + " \n\
				and p.assessment_appraise_id = " + bsettings.assessment_appraise_id
		);

		var planId = null;

		for (p in q){
			try {
				docPaUser = OpenDoc(UrlFromDocID(Int(p.id)));
				planId = docPaUser.TopElem.assessment_plan_id;
				DeleteDoc(UrlFromDocID(Int(p.id)));
			} catch(e) {
				alert(e);
			}
		}
		if (planId != null){
			DeleteDoc(UrlFromDocID(Int(planId)));
		}
		return tools.object_to_text({
			step: bsettings.steps.first
		}, 'json');
	}

	function post_DelegateUser(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		var data = tools.read_object(queryObjects.Body);
		var userId = data.HasProperty('user_id') ? data.user_id : null;
		var subordinates = data.HasProperty('subordinates') ? data.subordinates : null;

		var q = XQuery("sql: \n\
			select \n\
				ps.id pa_id, \n\
				aps.id assessment_plan_id \n\
			from pas ps \n\
			inner join assessment_plans aps on aps.id = ps.assessment_plan_id \n\
			where \n\
				ps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
				and ps.person_id in (" + subordinates.join(',') + ") \n\
				and ps.expert_person_id = " + curUserID + " \n\
				and ps.[status] = 'manager' \n\
		");

		var err = '';
		var objToSend = tools.object_to_text({
			assessmentAppraiseId: assessmentAppraiseId
		}, 'json');

		for (el in q) {
			try {
				paDoc = OpenDoc(UrlFromDocID(Int(el.pa_id)));
				paDoc.TopElem.custom_elems.ObtainChildByKey('manager_delegating_duties').value = paDoc.TopElem.expert_person_id;
				paDoc.TopElem.expert_person_id = userId;
				paDoc.Save();

				apDoc = OpenDoc(UrlFromDocID(Int(el.assessment_plan_id)));
				apDoc.TopElem.boss_id = userId;
				apDoc.Save();

				Utils.notificate('oc_1', Int(userId), paDoc.TopElem.person_id, objToSend);
			} catch(e) {
				err = err + e + '\r\n';
			}
		}

		if (err != '') {
			return tools.object_to_text({
				error: err
			}, 'json');
		}

		return tools.object_to_text({
			status: 'success'
		}, 'json');
	}

	function get_Report(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return tools.object_to_text({
				error: 'Не указана процедура оценки'
			}, 'json');
		}

		var userID = queryObjects.HasProperty('user_id') ? Trim(queryObjects.user_id) : curUserID;
		var _rules = Utils.docWvars(queryObjects.DocID);

		var path = Report.newReport(userID, _rules, assessmentAppraiseId);

		Request.AddRespHeader('Content-Type', 'application/octet-stream');
		Request.AddRespHeader('Content-disposition', 'attachment; filename=report.xlsx');
		return LoadFileData(path);
	}
%>