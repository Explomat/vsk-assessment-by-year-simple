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


	var st = Utils.getSystemSettings();
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

	function post_Meta(queryObjects) {

		function getConditions(
			blockSubId,
			userId,
			assessmentAppraiseId,
			competenceBlockId,
			assignImmediately,
			channelSelection,
			positionSelection,
			channelId,
			positionLevelId,
			isNeedTrain,
			isTrain
		) {
			/*alert('competenceBlockId: ' + competenceBlockId);
			alert('assignImmediately: ' + assignImmediately);
			alert('channelSelection: ' + channelSelection);
			alert('positionSelection: ' + positionSelection);
			alert('channelId: ' + channelId);
			alert('positionLevelId: ' + positionLevelId);*/

			/*if (isNeedTrain && isTrain == false) {
				return {
					hasPa: false,
					isNeedTrain: true,
					isTrain: false
				}
			} else if (isNeedTrain && isTrain) {

			}*/

			if (assignImmediately) {
				//alert('1111111111111111');
				Assessment.create(userId, assessmentAppraiseId, blockSubId, competenceBlockId, positionLevelId);
				return {
					hasPa: true,
					shouldHasPa: true
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
						shouldHasPa: true,
						channels: channels
					};
				} else if (channelSelection && positionSelection
					&& channelId != null && positionLevelId != null) {
					// create assessment
					//alert('22222222222');
					Assessment.create(userId, assessmentAppraiseId, blockSubId, positionLevelId);
					return {
						hasPa: true,
						shouldHasPa: true
					};
				} else if (channelSelection && channelId == null) {
					// return channels
					var channels = Assessment.getBlocksTree(competenceBlockId, false);
					return {
						hasPa: false,
						shouldHasPa: true,
						channels: channels
					};
				} else if (channelSelection && channelId != null) {
					//alert('33333333333');
					Assessment.create(userId, assessmentAppraiseId, blockSubId, channelId);
					return {
						hasPa: true,
						shouldHasPa: true
					};
				} else if (positionSelection && positionLevelId == null) {
					var channels = Assessment.getBlocksTree(competenceBlockId, false);
					return {
						hasPa: false,
						shouldHasPa: true,
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
					//alert('444444444');
					Assessment.create(userId, assessmentAppraiseId, blockSubId, positionLevelId);
					return {
						hasPa: true,
						shouldHasPa: true
					};
				}
			}

			return {
				hasPa: false,
				shouldHasPa: false
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
				hasPa: true,
				shouldHasPa: true
			});
		}

		var systemSettings = Utils.getSystemSettings();
		if (curUser.hire_date > systemSettings.TopElem.stop_hire_date) {
			return Utils.setSuccess({
				hasPa: false,
				shouldHasPa: false
			});
		}

		try {
			var bsettings = Settings.baseSettings(assessmentAppraiseId);
			var blocks = bsettings.blocks;

			var gkBs = User.getBlockSub(curUserID, blocks.gk);
			//alert('gkBs: ' + tools.object_to_text(gkBs, 'json'));
			
			var topBg = User.getBlockGroup(curUserID, blocks.top);
			//alert('topBg: ' + tools.object_to_text(topBg, 'json'));

			var dmBs = User.getBlockSub(curUserID, blocks.division_moscow);
			//alert('dmBs: ' + tools.object_to_text(dmBs, 'json'));

			//alert('curUserID_1: ' + curUserID);
			var aBs = User.getBlockSub(curUserID, blocks.affiliate);
			//alert('curUserID: ' + curUserID);
			//alert('aBs: ' + tools.object_to_text(aBs, 'json'));

			var amBs = User.getBlockSub(curUserID, blocks.affiliate_manager);
			//alert('amBs: ' + tools.object_to_text(amBs, 'json'));

			var cblock = null;
			var isNeedTrain = false;

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

					isNeedTrain = true;
					cblock = tBg;
				} else {
					if (topBg != undefined) {
						cblock = topBg;
						//alert('cblock: ' + tools.object_to_text(cblock, 'json'));
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
					cblock.DocID,
					curUserID,
					assessmentAppraiseId,
					cblock.TopElem.competence_block,
					cblock.TopElem.assign_immediately,
					cblock.TopElem.channel_selection,
					cblock.TopElem.position_selection,
					channelId,
					positionLevelId,
					isNeedTrain,
					isTrain
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
		var excudeSubordinates = queryObjects.HasProperty('subordinates') ? Trim(queryObjects.subordinates) : '';
		return Utils.setSuccess(Lists.getCollaborators(curUserID, search, excudeSubordinates));
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
			var minRow = queryObjects.HasProperty('min_row') ? OptInt(queryObjects.min_row) : 0;
			var maxRow = queryObjects.HasProperty('max_row') ? OptInt(queryObjects.max_row) : 10;
			var isPrev = queryObjects.HasProperty('is_prev') ? Utils.toBoolean(queryObjects.is_prev) : false;
			var isNext = queryObjects.HasProperty('is_next') ? Utils.toBoolean(queryObjects.is_next) : true;

			//alert('initial_minRow: ' + minRow + ' initial_maxRow: ' + maxRow);

			if (isNext) {
				//alert('isNext');
				minRow = maxRow;
				maxRow = minRow + pageSize;
				//alert('minRow: ' + minRow + ' maxRow: ' + maxRow);
			} else if (isPrev) {
				//alert('isPrev');
				maxRow = minRow;
				var temp = maxRow - pageSize;
				minRow = temp < 0 ? 0 : temp;
				//alert('minRow: ' + minRow + ' maxRow: ' + maxRow);
			}

			/*var min = (page - 1) * pageSize;
			var max = min + pageSize;*/

			var systemSettings = Utils.getSystemSettings();
			var subList = User.getSubordinates(curUserID, assessmentAppraiseId, systemSettings.TopElem.stop_hire_date, search, minRow, maxRow, pageSize);		
			return Utils.setSuccess(subList);
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
			var systemSettings = Utils.getSystemSettings();
			var user = User.getUser(userID, assessmentAppraiseId, systemSettings.TopElem.stop_hire_date);
			var managers = User.getManagers(userID, assessmentAppraiseId);
			var _rules = Utils.docWvars(queryObjects.DocID);

			var userDoc = OpenDoc(UrlFromDocID(Int(userID)));

			if (userDoc.TopElem.hire_date > systemSettings.TopElem.stop_hire_date) {
				user.shouldHasPa = false;

				return Utils.setSuccess({
					meta: {
						curUserID: curUserID,
						canEditSelf: false,
						canEditBoss: true,
						isAssessmentCompleted: false
					},
					user: user,
					managers: managers,
					assessment: { pas:[] },
					commonCompetences: [],
					rules: _rules
				});
			}

			user.shouldHasPa = true;
			var plan = Assessment.getAssessmentPlan(userID, assessmentAppraiseId);
			var meta = Assessment.setComputedFields(curUserID, userID, plan.boss_id, plan.step);
			var pasData = User.getPas(userID, undefined, assessmentAppraiseId);
			var commonCompetences = Assessment.getCommonCompetences(userID, assessmentAppraiseId);

			var ast = {};
			if (plan != undefined){
				var aapDoc = OpenDoc(UrlFromDocID(Int(assessmentAppraiseId)));

				ast = {
					name: String(aapDoc.TopElem.name),
					step: String(plan.step),
					startDate: StrXmlDate(Date(aapDoc.TopElem.start_date)),
					finishDate: StrXmlDate(Date(aapDoc.TopElem.end_date)),
					stepName: String(plan.stepName),
					overall: String(plan.overall),
					pas: pasData
				}
			}

			return Utils.setSuccess({
				meta: meta,
				user: user,
				managers: managers,
				assessment: ast,
				commonCompetences: commonCompetences,
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
			var curPaCard = Assessment.update(Int(paId), _competences, overall, 4);

			Assessment.complete(paId, assessmentAppraiseId);
			var bossId = User.getAssessmentBossId(curUserID, assessmentAppraiseId);

			if (bossId != undefined) {
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

		if (paId == null) {
			return Utils.setError('Анкета не найдена');
		}

		try {
			var curPaCard = Assessment.update(Int(paId), _competences, overall, 2);
			//оценка руководителя
			var docManager = Assessment.createBoss(Int(paId), assessmentAppraiseId);

			var objToSend = tools.object_to_text({
				assessmentAppraiseId: assessmentAppraiseId
			}, 'json');
			Utils.notificate('oc_2', docManager.TopElem.expert_person_id, curUserID, objToSend);

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