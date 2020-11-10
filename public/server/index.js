<%
	var Utils = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/utils.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/utils.js');

	var User = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');

	var Assessment = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/assessment.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/assessment.js');

	var Report = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/report.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/report.js');

	var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');

	var Lists = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/lists.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/lists.js');

	var curUserID = 6711785032659205612; // me test
	//var curUserID = 6770996101418848653; // user test
	//var curUserID = 6148914691236517121; // user prod
	//var curUserID = 6605157354988654063; // пичугина prod

	function post_Meta(queryObjects) {

		function getConditions(
			userId,
			assessmentAppraiseId,
			competenceBlockId,
			assignImmediately,
			channelSelection,
			positionSelection,
			channelId,
			positionLevelId
		) {
			alert('competenceBlockId: ' + competenceBlockId);
			alert('assignImmediately: ' + assignImmediately);
			alert('channelSelection: ' + channelSelection);
			alert('positionSelection: ' + positionSelection);
			alert('channelId: ' + channelId);
			alert('positionLevelId: ' + positionLevelId);

			if (assignImmediately) {
				alert('1111111111111111');
				Assessment.create(userId, assessmentAppraiseId, channelId, positionLevelId);
				return {
					hasPa: true
				};
			} else {
				if (
					channelSelection && positionSelection
					&& channelId == null && positionLevelId == null
				) {
					// return channels and positions
					var channels = Assessment.getBlocksTree(competenceBlockId);
					return {
						hasPa: false,
						channels: channels
					};
				} else if (channelSelection && positionSelection
					&& channelId != null && positionLevelId != null) {
					// create assessment
					alert('22222222222');
					Assessment.create(userId, assessmentAppraiseId, positionLevelId);
					return {
						hasPa: true
					};
				} else if (channelSelection && channelId == null) {
					// return channels
					var channels = Assessment.getBlocksTree(competenceBlockId, false);
					return {
						hasPa: false,
						channels: channels
					};
				} else if (channelSelection && channelId != null) {
					alert('33333333333');
					Assessment.create(userId, assessmentAppraiseId, channelId);
					return {
						hasPa: true
					};
				} else if (positionSelection && positionLevelId == null) {
					var channels = Assessment.getBlocksTree(competenceBlockId, false);
					return {
						hasPa: false,
						channels: channels
					};
					//alert(1);
					// return positions
					// Автоматически определить вертикаль
					/*return {
						hasPa: false,
						positions: positions
					};*/
				} else if (positionSelection && positionLevelId != null) {
					alert('444444444');
					Assessment.create(userId, assessmentAppraiseId, positionLevelId);
					return {
						hasPa: true
					};
				}
			}

			return {
				hasPa: false
			}
		}

		var data = tools.read_object(queryObjects.Body);
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		var isTrain = data.HasProperty('is_train') ? Utils.toBoolean(data.is_train) : null;
		var channelId = data.HasProperty('channel_id') ? data.channel_id : null;
		var positionLevelId = data.HasProperty('position_level_id') ? data.position_level_id : null;

		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
		}

		var hasPa = User.hasPa(curUserID, assessmentAppraiseId);
		if (hasPa) {
			return Utils.setSuccess({
				hasPa: true
			});
		}

		try {
			var bsettings = Settings.baseSettings(assessmentAppraiseId);
			var blocks = bsettings.blocks;

			var isPa = User.hasPa(curUserID, assessmentAppraiseId);
			//alert('isPa: ' + tools.object_to_text(isPa, 'json'));

			var gkBs = User.getBlockSub(curUserID, blocks.gk);
			//alert('gkBs: ' + tools.object_to_text(gkBs, 'json'));

			var topBg = User.getBlockGroup(curUserID, blocks.top);
			//alert('topBg: ' + tools.object_to_text(topBg, 'json'));

			var dmBs = User.getBlockSub(curUserID, blocks.division_moscow);
			//alert('dmBs: ' + tools.object_to_text(dmBs, 'json'));

			var aBs = User.getBlockSub(curUserID, blocks.affilate);
			//alert('aBs: ' + tools.object_to_text(aBs, 'json'));

			var amBs = User.getBlockSub(curUserID, blocks.affiliate_manager);
			//alert('amBs: ' + tools.object_to_text(amBs, 'json'));

			var cblock = null;

			if (gkBs != undefined) {
				if (isTrain) {
					var tBg = User.getBlockGroup(curUserID, blocks.trains);

					if (tBg != undefined) {
						var grDoc = OpenDoc(UrlFromDocID(Int(tBg.TopElem.group)));
						grDoc.TopElem.collaborators.ObtainChildByKey(curUserID);
						grDoc.Save();
					} else {
						return Utils.setError('Не указана группа, обратитесь в поддержку портала');
					}

					cblock = tBg;
				} else {
					if (topBg != undefined) {
						cblock = topBg;
					} else if (dmBs != undefined) {
						// выбрать вертикаль, уровень должности
						cblock = dmBs;
					} else {
						// выбрать уровень должности
						cblock = gkBs;
					}
				}
			} else if (aBs != undefined) {
				if (amBs != undefined) {
					cblock = amBs;
				} else {
					// выбрать вертикаль, уровень должности
					cblock = aBs;
				}
			}

			if (cblock != null) {
				var conds = getConditions(
					curUserID,
					assessmentAppraiseId,
					cblock.TopElem.competence_block,
					cblock.TopElem.assign_immediately,
					cblock.TopElem.channel_selection,
					cblock.TopElem.position_selection,
					channelId,
					positionLevelId
				);

				return Utils.setSuccess(conds);
			} else {
				return Utils.setError('Ваш профиль не подходит под условия');
			}
		} catch (e) {
			return Utils.setError(e);
		}
	}

	function get_Collaborators(queryObjects) {
		var search = queryObjects.HasProperty('search') ? Trim(queryObjects.search) : '';
		return Utils.setSuccess(Lists.getCollaborators(curUserID, search));
	}

	function get_Subordinates(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;

		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
		}

		try {
			var search = queryObjects.HasProperty('search') ? queryObjects.search : '';
			var page = queryObjects.HasProperty('page') ? OptInt(queryObjects.page) : 1;
			var pageSize = queryObjects.HasProperty('page_size') ? OptInt(queryObjects.page_size) : 10;

			var min = (page - 1) * pageSize;
			var max = min + pageSize;

			var subList = User.getSubordinates(curUserID, assessmentAppraiseId, search, min, max, pageSize);		
			Utils.setSuccess(subList);
		} catch(e) {
			return Utils.setError(e);
		}
	}

	function get_Profile(queryObjects) {
		var userID = queryObjects.HasProperty('user_id') ? Trim(queryObjects.user_id) : curUserID;
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;

		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
		}

		try {
			var userData = User.getUser(userID, assessmentAppraiseId);
			//var instruction = Utils.instruction(assessmentAppraiseId);
			var managerData = User.getManager(userID, assessmentAppraiseId);
			var planData = Assessment.getAssessmentPlan(userID, assessmentAppraiseId);
			var pasData = User.getPas(userID, undefined, assessmentAppraiseId);
			var commonCompetencesData = Assessment.getCommonCompetences(assessmentAppraiseId);
			var _rules = Utils.docWvars(queryObjects.DocID);

			var manager = {};
			if (managerData != undefined){
				manager = {
					id: String(managerData.id),
					fullname: String(managerData.fullname),
					position: String(managerData.position),
					department: String(managerData.department)
				}
			} 

			var ast = {};
			if (planData != undefined){
				var aapDoc = OpenDoc(UrlFromDocID(Int(assessmentAppraiseId)));

				ast = {
					name: String(aapDoc.TopElem.name),
					step: String(planData.step),
					startDate: StrXmlDate(Date(aapDoc.TopElem.start_date)),
					finishDate: StrXmlDate(Date(aapDoc.TopElem.end_date)),
					stepName: String(planData.stepName),
					overall: String(planData.overall),
					pas: pasData
				}
			}

			return Utils.setSuccess({
				meta: Assessment._setComputedFields(assessmentAppraiseId, curUserID, userID, manager.id, planData.step),
				//instruction: String(instruction),
				user: userData,
				manager: manager,
				assessment: ast,
				commonCompetences: commonCompetencesData,
				rules: _rules
			});
		} catch(e) {
			return Utils.setError(e);
		}
	}

	function get_Instruction(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
		}

		var instruction = Utils.instruction(assessmentAppraiseId);
		return Utils.setSuccess(String(instruction));
	}

	function post_ThirdStep(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
		}

		var data = tools.read_object(queryObjects.Body);
		var paId = data.HasProperty('id') ? data.id : null;
		var overall = data.HasProperty('overall') ? data.overall : '';
		var _competences = data.HasProperty('competences') ? data.competences : null;

		try {
			var curPaCard = Assessment.update(Int(paId), _competences, overall, 3);

			Assessment.complete(curUserID, assessmentAppraiseId);
			var bossId = User.getAssessmentBossId(curUserID, assessmentAppraiseId);

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

			return Utils.setSuccess({ step: 4 });
		} catch(e) {
			return Utils.setError(e);
		}
	}

	function post_SecondStep(queryObjects){
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
		}

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
			var curPaCard = Assessment.update(Int(paId), _competences, overall, 2);

			var objToSend = tools.object_to_text({
				assessmentAppraiseId: assessmentAppraiseId
			}, 'json');
			Utils.notificate('oc_2', docPlan.TopElem.boss_id, curUserID, objToSend);

		} catch(e){ return Utils.setError(e); }

		return Utils.setSuccess({
			step: 2
		});
	}

	function post_ResetManager(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
		}

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

		return Utils.setSuccess({ step: bsettings.steps.first });
	}

	function post_DelegateUser(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки.');
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
			return Utils.setError(err);
		}

		return Utils.setSuccess({});
	}

	function get_Report(queryObjects) {
		var assessmentAppraiseId = queryObjects.HasProperty('assessment_appraise_id') ? queryObjects.assessment_appraise_id : null;
		if (assessmentAppraiseId == null) {
			return Utils.setError('Не указана процедура оценки');
		}

		var userID = queryObjects.HasProperty('user_id') ? Trim(queryObjects.user_id) : curUserID;
		var _rules = Utils.docWvars(queryObjects.DocID);

		var path = Report.create(userID, _rules, assessmentAppraiseId);

		Request.AddRespHeader('Content-Type', 'application/octet-stream');
		Request.AddRespHeader('Content-disposition', 'attachment; filename=report.xlsx');
		return LoadFileData(path);
	}
%>