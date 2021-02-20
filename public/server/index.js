<%
	var Utils = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_ver2/server/utils.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_ver2/server/utils.js');

	var User = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_ver2/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_ver2/server/user.js');

	var Assessment = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_ver2/server/assessment.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_ver2/server/assessment.js');

	var Report = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_ver2/server/report.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_ver2/server/report.js');

	var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_ver2/server/settings.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_ver2/server/settings.js');

	var Lists = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_ver2/server/lists.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_ver2/server/lists.js');


	// 6928287565866297168 - prod
	// 6790263731625424310 - test

/*	var st = Utils.getSystemSettings(6790263731625424310);
	var curUserID = OptInt(st.TopElem.cur_user_id); //6711785032659205612;
	var curUser = OpenDoc(UrlFromDocID(curUserID)).TopElem;*/

	//var curUserID = 6711785032659205612; // me test
	//var curUserID = 6719948502038810952; // volkov test
	//var curUserID = 6719947231785930663; // boss test
	//var curUserID = 6719948119925684121; //baturin test
	//var curUserID = 6719948507670014353; // hrbp test
	//var curUserID = 6770996101418848653; // user test
	//var curUserID = 6148914691236517121; // user prod
	//var curUserID = 6605157354988654063; // пичугина prod

	function isAccessToAssessment(curUserDocTe, stopHireDate, assessmentAppraiseId) {
		if (
				curUserDocTe.hire_date <= stopHireDate &&
				curUserDocTe.current_state != 'Декретный' &&
				curUserDocTe.current_state != 'Женщинам дети до 1,5' &&
				curUserDocTe.current_state != 'Уход 1,5' &&
				curUserDocTe.current_state != 'Уход до 3'
			) {
			return true;
		}
		return false;
	}

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
			isNeedAskTrain,
			isTrain
		) {
			/*alert('blockSubId: ' + blockSubId);
			alert('userId: ' + userId);
			alert('assessmentAppraiseId: ' + assessmentAppraiseId);
			alert('competenceBlockId: ' + competenceBlockId);
			alert('assignImmediately: ' + assignImmediately);
			alert('channelSelection: ' + channelSelection);
			alert('positionSelection: ' + positionSelection);
			alert('channelId: ' + channelId);
			alert('positionLevelId: ' + positionLevelId);
			alert('isNeedAskTrain: ' + isNeedAskTrain);
			alert('isTrain: ' + isTrain);*/

			// isTrain - 3 значения. true / false / null
			if (isNeedAskTrain && isTrain == null) {
				return {
					hasPa: false,
					isNeedAskTrain: isNeedAskTrain,
					isTrain: isTrain
				}
			}

			if (assignImmediately) {
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
					//return channels and positions
					var channels = Assessment.getBlocksTree(competenceBlockId);
					return {
						hasPa: false,
						shouldHasPa: true,
						channels: channels
					};
				} else if (channelSelection && positionSelection
					&& channelId != null && positionLevelId != null) {
					Assessment.create(userId, assessmentAppraiseId, blockSubId, positionLevelId);
					return {
						hasPa: true,
						shouldHasPa: true
					};
				} else if (channelSelection && channelId == null) {
					var channels = Assessment.getBlocksTree(competenceBlockId, false);
					return {
						hasPa: false,
						shouldHasPa: true,
						channels: channels
					};
				} else if (channelSelection && channelId != null) {
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
				} else if (positionSelection && positionLevelId != null) {
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

		var systemSettings = Utils.getSystemSettings(assessmentAppraiseId);
		var isAccess = isAccessToAssessment(curUser, systemSettings.TopElem.stop_hire_date, assessmentAppraiseId);
		if (!isAccess) {
			return Utils.setSuccess({
				hasPa: false,
				shouldHasPa: false
			});
		}

		try {
			var bsettings = Settings.baseSettings(assessmentAppraiseId);
			var blocks = bsettings.blocks;

			var gkBs = User.getBlockSubByUserId(curUserID, blocks.gk, assessmentAppraiseId);
			//alert('gkBs:' + tools.object_to_text(gkBs, 'json'));
			var topBg = User.getBlockGroupByUserId(curUserID, blocks.top, assessmentAppraiseId);
			//alert('topBg:' + tools.object_to_text(topBg, 'json'));
			var fscBs = User.getBlockSubByUserId(curUserID, blocks.federal_service_center, assessmentAppraiseId);
			//alert('fscBs:' + tools.object_to_text(fscBs, 'json'));
			var dmBs = User.getBlockSubByUserId(curUserID, blocks.division_moscow, assessmentAppraiseId);
			//alert('dmBs:' + tools.object_to_text(dmBs, 'json'));
			var aBs = User.getBlockSubByUserId(curUserID, blocks.affiliate, assessmentAppraiseId);
			//alert('aBs:' + tools.object_to_text(aBs, 'json'));
			var amBs = User.getBlockSubByUserId(curUserID, blocks.affiliate_manager, assessmentAppraiseId);
			//alert('amBs:' + tools.object_to_text(amBs, 'json'));

			var cblock = null;
			var isNeedAskTrain = false;

			if (gkBs != undefined) {
				if (isTrain) {
					var tBg = User.getBlockGroupByUserId(curUserID, blocks.trains, assessmentAppraiseId);

					if (tBg == undefined) {
						tBg = User.getBlockGroup(blocks.trains, assessmentAppraiseId);

						if (tBg != undefined) {
							var grDoc = OpenDoc(UrlFromDocID(Int(tBg.TopElem.group)));
							grDoc.TopElem.collaborators.ObtainChildByKey(curUserID);
							grDoc.Save();
						} else {
							return Utils.setError('Не указана группа для вашей должности.');
						}
					}

					cblock = tBg;
				} else {
					//alert('else');
					if (isTrain == null) {
						isNeedAskTrain = true;
					}

					if (topBg != undefined) {
						cblock = topBg;
					} else if (fscBs != undefined) {
						//alert('11111111111111111111111111111111');
						cblock = fscBs;
					} else if (dmBs != undefined) {
						cblock = dmBs;
					} else {
						cblock = gkBs;
					}
				}
			} else if (aBs != undefined) {
				//alert(1);
				if (amBs != undefined) {
					//alert(2);
					cblock = amBs;
				} else {
					//alert(3);
					cblock = aBs;
				}
			}

			if (cblock != null && cblock != undefined) {
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
					isNeedAskTrain,
					isTrain
				);

				//alert('conds: ' + tools.object_to_text(conds, 'json'));

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

			if (isNext) {
				minRow = maxRow;
				maxRow = minRow + pageSize;
			} else if (isPrev) {
				maxRow = minRow;
				var temp = maxRow - pageSize;
				minRow = temp < 0 ? 0 : temp;
			}

			var systemSettings = Utils.getSystemSettings(assessmentAppraiseId);
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
			var systemSettings = Utils.getSystemSettings(assessmentAppraiseId);
			var user = User.getUser(userID, assessmentAppraiseId, systemSettings.TopElem.stop_hire_date);
			var managers = User.getManagers(userID, assessmentAppraiseId);
			var _rules = Utils.getCommonAssessments(assessmentAppraiseId);
			//alert(tools.object_to_text(_rules, 'json'));

			var userDoc = OpenDoc(UrlFromDocID(Int(userID)));
			var isAccess = isAccessToAssessment(userDoc.TopElem, systemSettings.TopElem.stop_hire_date, assessmentAppraiseId);
			if (!isAccess) {
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
			var meta = Assessment.setComputedFields(assessmentAppraiseId, curUserID, userID, plan.boss_id, plan.step);
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

			var dp = ArrayOptFirstElem(XQuery("sql: \n\
				select id \n\
				from development_plans \n\
				where \n\
					person_id = " + userID + " \n\
					and assessment_appraise_id = " + assessmentAppraiseId)
			);

			meta.hasIdp = (dp != undefined);

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
			//var bossId = User.getAssessmentBossId(curUserID, assessmentAppraiseId);

			var bossFullname = curPaCard.TopElem.expert_person_id.OptForeignElem.fullname;
			Utils.notificate('ver2_oc_5', curPaCard.TopElem.person_id, assessmentAppraiseId, bossFullname);
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
			Utils.notificate('ver2_oc_4', docManager.TopElem.expert_person_id, assessmentAppraiseId, curUser.fullname);

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
		for (p in q) {
			try {
				docPaUser = OpenDoc(UrlFromDocID(Int(p.id)));
				planId = docPaUser.TopElem.assessment_plan_id;
				DeleteDoc(UrlFromDocID(Int(p.id)));
			} catch(e) {
				alert(e);
			}
		}
		if (planId != null) {
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

		if (OptInt(userId) == undefined || subordinates == null) {
			return Utils.setError('Не указаны руководитель или делегирующие');
		}

		var qcs = XQuery("sql: \n\
			select \n\
				cs.id collaborator_id,  \n\
				aps.id assessment_plan_id, \n\
				dps.id development_plan_id, \n\
				aps.boss_id, \n\
				cs.fullname collaborator_fullname, \n\
				ps.id boss_pa_id, \n\
				ccads.id delegate_id \n\
			from collaborators cs \n\
			left join assessment_plans aps on (aps.person_id = cs.id and aps.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
			left join pas ps on (ps.assessment_plan_id = aps.id and ps.expert_person_id = " + curUserID + ") \n\
			left join cc_assessment_delegates ccads on (ccads.[user_id] = cs.id and ccads.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
			left join development_plans dps on (dps.person_id = cs.id and dps.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
			where \n\
				cs.id in (" + subordinates.join(',') + ") \n\
		");

		var err = '';
		var objToSend = tools.object_to_text({
			assessmentAppraiseId: assessmentAppraiseId
		}, 'json');

		for (el in qcs) {
			try {
				if (el.delegate_id == null) {
					delegateDoc = tools.new_doc_by_name('cc_assessment_delegate');
					delegateDoc.BindToDb(DefaultDb);
				} else {
					delegateDoc = OpenDoc(UrlFromDocID(Int(el.delegate_id)));
				}

				if (el.boss_pa_id != null) {
					paDoc = OpenDoc(UrlFromDocID(Int(el.boss_pa_id)));
					paDoc.TopElem.expert_person_id = userId;
					paDoc.Save();
				}

				if (el.assessment_plan_id != null) {
					delegateDoc.TopElem.prev_boss_id = el.boss_id;

					apDoc = OpenDoc(UrlFromDocID(Int(el.assessment_plan_id)));
					apDoc.TopElem.boss_id = userId;
					apDoc.Save();
				} else {
					userBoss = User.getBoss(el.collaborator_id, assessmentAppraiseId);
					if (userBoss != undefined) {
						delegateDoc.TopElem.prev_boss_id = userBoss.person_id;
					}
				}

				if (el.development_plan_id != null) {
					dDoc = OpenDoc(UrlFromDocID(Int(el.development_plan_id)));
					dDoc.TopElem.expert_person_id = userId;
					dDoc.Save();
				}

				delegateDoc.TopElem.fullname = String(el.collaborator_fullname);
				delegateDoc.TopElem.user_id = OptInt(el.collaborator_id);
				delegateDoc.TopElem.boss_delegate_id = userId;
				delegateDoc.TopElem.assessment_appraise_id = assessmentAppraiseId;
				delegateDoc.Save();

				// меняем юзера в согласовании ИПР
				mfq = XQuery("sql: \n\
					select imfs.id, imfs.current_collaborator_id, imfs.next_collaborator_id \n\
					from cc_idp_main_flows imfs \n\
					inner join cc_idp_mains ims on ims.id = imfs.idp_main_id \n\
					inner join development_plans dps on dps.id = ims.development_plan_id \n\
					where \n\
						dps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
						and imfs.is_active_step = 1 \n\
						and dps.person_id in (" + subordinates.join(',') + ") \n\
					order by imfs.current_collaborator_id \n\
				");

				for (el in mfq) {
					if (el.current_collaborator_id != el.next_collaborator_id) {
						mfDoc = OpenDoc(UrlFromDocID(Int(el.id)));
						mfDoc.TopElem.next_collaborator_id = userId;
						mfDoc.Save();
					}
				}
			} catch(e) {
				err = err + e;
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
		var _rules = Utils.getCommonAssessments(assessmentAppraiseId);

		var path = Report.create(userID, _rules, assessmentAppraiseId);

		Request.AddRespHeader('Content-Type', 'application/octet-stream');
		Request.AddRespHeader('Content-disposition', 'attachment; filename=report.xlsx');
		return LoadFileData(path);
	}
%>