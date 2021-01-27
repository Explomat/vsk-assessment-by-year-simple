function getFirstStateId() {
	var s = ArrayOptFirstElem(XQuery("sql: \n\
		select st.* \n\
		from cc_idp_states st \n\
		order by st.code asc \n\
	"));

	return s == undefined ? null : s.id;
}

function update(dpId, comps, assessmentAppraiseId) {
	function findItemsForRemove(firstArr, secondArr, firstKey, secondKey) {
		var rarr = [];

		for (el in secondArr) {
			item = ArrayOptFind(firstArr, ('This.' + firstKey + ' == ' + el.GetOptProperty(secondKey)));
			if (item == undefined) {
				rarr.push(el);
			}
		}

		return rarr;
	}

	var dpDoc = OpenDoc(UrlFromDocID(Int(dpId)));

	// удаляем задачи только задачи, у которых удалили компетенцию
	var rcomps = findItemsForRemove(comps, ArrayDirect(dpDoc.TopElem.competences), 'id', 'competence_id');
	for (el in rcomps) {
		tsq = XQuery("sql: \n\
			select its.id \n\
			from cc_idp_tasks its \n\
			where \n\
				its.development_plan_id = " + dpId + " \n\
				and its.competence_id = " + el.competence_id + " \n\
		");

		for (iel in tsq) {
			DeleteDoc(UrlFromDocID(Int(iel.id)));
		}
	}

	// удаляем компетенции из плана развития
	dpDoc.TopElem.competences.DeleteChildren('This.competence_id != null');

	// удаляем темы
	tmq = XQuery("sql: \n\
		select ics.id \n\
		from cc_idp_competences ics \n\
		where \n\
			ics.development_plan_id = " + dpId + " \n\
	");

	for (iel in tmq) {
		DeleteDoc(UrlFromDocID(Int(iel.id)));
	}

	dpDoc.Save();
	////
	
	for (el in comps) {
		compChild = dpDoc.TopElem.competences.AddChild();
		compChild.competence_id = el.id;

		if (el.GetOptProperty('themes') != undefined) {
			for (ct in el.themes) {
				ctDoc = tools.new_doc_by_name('cc_idp_competence');
				ctDoc.TopElem.fullname = dpDoc.TopElem.person_id.OptForeignElem.fullname;
				ctDoc.TopElem.development_plan_id = dpDoc.DocID;
				ctDoc.TopElem.competence_id = el.id;
				ctDoc.TopElem.idp_theme_id = ct.id;
				ctDoc.TopElem.percent_complete = 0;
				ctDoc.BindToDb(DefaultDb);
				ctDoc.Save();
			}
		}
	}

	dpDoc.Save();
}

function create(userId, comps, assessmentAppraiseId) {
	function calculatePlanDate(startDate, duration /* в месяцах */) {
		var d = OptInt(duration);
		
		if (d != undefined){
			var _date = new Date(startDate);
			var nextMonth = (Month(_date) + d) % 12;
			nextMonth = nextMonth == 0 ? 12 : nextMonth;
			var nextDay = Day(_date);
			var nextYear = Year(_date);
			if ((Month(_date) + d) > 12) {
				nextYear = nextYear + 1;
			}

			if (nextMonth == 2 && nextDay > 28){
				nextDay = 28;
				if ((nextYear % 4) == 0) { //високосный
					nextDay = 29;
				}
			}

			return Date(nextDay + '.' + nextMonth + '.' + nextYear);
		}

		return '';
	}

	var User = OpenCodeLib('./user.js');
	DropFormsCache('./user.js');

	var Step = OpenCodeLib('./step.js');
	DropFormsCache('./step.js');

	var Assessment = OpenCodeLib('./assessment.js');
	DropFormsCache('./assessment.js');

	var Task = OpenCodeLib('./task.js');
	DropFormsCache('./task.js');

	var manager = User.getManagerForIdp(userId, assessmentAppraiseId);
	var ap = Assessment.getAssessmentPlanByUserId(userId, assessmentAppraiseId);

	if (manager == undefined || ap == undefined) {
		throw 'Руководитель или оценка не определены';
	}

	//план развития
	var dpDoc = tools.new_doc_by_name('development_plan');
	dpDoc.TopElem.person_id = userId;
	dpDoc.TopElem.expert_person_id = manager.id;
	dpDoc.TopElem.assessment_appraise_id = assessmentAppraiseId;
	dpDoc.TopElem.assessment_plan_id = ap.id;
	dpDoc.TopElem.workflow_id = ap.workflow_id;
	dpDoc.TopElem.workflow_state = ap.workflow_state;
	dpDoc.TopElem.workflow_state_name = ap.workflow_state_name;
	dpDoc.BindToDb(DefaultDb);
	dpDoc.Save();

	//главный документ
	var userDoc = OpenDoc(UrlFromDocID(Int(userId)));
	var mDoc = tools.new_doc_by_name('cc_idp_main');
	mDoc.TopElem.fullname = userDoc.TopElem.fullname;
	mDoc.TopElem.development_plan_id = dpDoc.DocID;
	mDoc.TopElem.create_date = new Date();
	mDoc.TopElem.plan_date = calculatePlanDate(new Date(), 3);
	mDoc.TopElem.idp_state_id = getFirstStateId();
	mDoc.BindToDb(DefaultDb);
	mDoc.Save();

	// начальный этап
	var firstMainStep = Step.getFirstMainStep();
	var firstStep = Step.getFirstStep();

	var firstMainStepId = firstMainStep != undefined ? firstMainStep.id : null;
	var firstStepId = firstStep != undefined ? firstStep.id : null;

	var tfDoc = Step.create(null, {
		idp_main_id: mDoc.DocID,
		current_collaborator_id: userId,
		next_collaborator_id: userId,
		idp_step_id: firstStepId,
		idp_main_step_id: firstMainStepId
	});

	var nextStep = Step.getNextStepById(firstStepId);
	Step.create(tfDoc.DocID, {
		next_collaborator_id: manager.id,
		idp_step_id: (nextStep != undefined ? nextStep.id : null)
	});

/*	var tfDoc = tools.new_doc_by_name('cc_idp_main_flow');
	tfDoc.TopElem.idp_main_id = mDoc.DocID;
	tfDoc.TopElem.current_collaborator_id = userId;
	tfDoc.TopElem.next_collaborator_id = userId;
	tfDoc.TopElem.idp_step_id = getFirstStepId();
	tfDoc.TopElem.idp_main_step_id = firstMainStepId;
	tfDoc.TopElem.created_date = new Date();
	tfDoc.TopElem.is_active_step = false;
	tfDoc.BindToDb(DefaultDb);
	tfDoc.Save();

	// следующий этап, перевод на рук-ля
	tfDoc = tools.new_doc_by_name('cc_idp_main_flow');
	tfDoc.TopElem.idp_main_id = mDoc.DocID;
	tfDoc.TopElem.current_collaborator_id = userId;
	tfDoc.TopElem.next_collaborator_id = manager.id;
	tfDoc.TopElem.idp_step_id = getFirstStepId();
	tfDoc.TopElem.idp_main_step_id = firstMainStepId;
	tfDoc.TopElem.created_date = new Date();
	tfDoc.TopElem.is_active_step = true;
	tfDoc.BindToDb(DefaultDb);
	tfDoc.Save();*/


	for (c in comps) {
		compChild = dpDoc.TopElem.competences.AddChild();
		compChild.competence_id = c.id;

		for (ct in c.themes) {
			ctDoc = tools.new_doc_by_name('cc_idp_competence');
			ctDoc.TopElem.fullname = userDoc.TopElem.fullname;
			ctDoc.TopElem.development_plan_id = dpDoc.DocID;
			ctDoc.TopElem.competence_id = c.id;
			ctDoc.TopElem.idp_theme_id = ct.id;
			ctDoc.TopElem.percent_complete = 0;
			ctDoc.BindToDb(DefaultDb);
			ctDoc.Save();
		}

		if (c.GetOptProperty('tasks') != undefined) {
			for (t in c.tasks) {
				Task.create(t.description, t.resut_form, t.expert_collaborator_id, t.idp_task_type_id, dpDoc.DocID, c.id);
			}
		}
	}

	dpDoc.Save();

	return mDoc;
}

function getObject(dpId, assessmentAppraiseId) {
	var Step = OpenCodeLib('./step.js');
	DropFormsCache('./step.js');

	var User = OpenCodeLib('./user.js');
	DropFormsCache('./user.js');

	var Task = OpenCodeLib('./task.js');
	DropFormsCache('./task.js');

	var Theme = OpenCodeLib('./theme.js');
	DropFormsCache('./theme.js');

	var obj = {
		managers: [],
		main_steps: [],
		competences: [],
		main_flows: [],
		task_types: Task.getTaskTypes()
	}

	var qdp = ArrayOptFirstElem(
		XQuery("sql: \n\
			select \n\
				dps.person_id, \n\
				dps.person_fullname, \n\
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
				dps.id = " + dpId + " \n\
				and dps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
		")
	);

	if (qdp != undefined) {
		obj.person_id = OptInt(qdp.person_id);
		obj.person_fullname = String(qdp.person_fullname);
		obj.development_plan_id = OptInt(qdp.development_plan_id);
		obj.create_date = StrXmlDate(Date(qdp.create_date));
		obj.plan_date = StrXmlDate(Date(qdp.plan_date)),
		obj.step_id = OptInt(qdp.step_id);
		obj.step_name = String(qdp.step_name);
		obj.main_step_id = OptInt(qdp.main_step_id);
		obj.main_step_name = String(qdp.main_step_name);
		obj.state_id = OptInt(qdp.state_id);
		obj.state_name = String(qdp.state_name);


		// руководители
		obj.managers = User.getManagers(qdp.person_id, assessmentAppraiseId);

		// общие этапы
		var mainSteps = Step.getMainSteps();
		var startDate = obj.create_date;

		for (s in mainSteps) {
			sobj = {
				id: String(s.id),
				name: String(s.name),
				duration_months: String(s.duration_months),
				order_number: String(s.order_number),
				date: StrXmlDate(Date(startDate))
			}

			if (s.duration_months == '0') {
				sobj.date = StrXmlDate(Date(startDate));
			} else {
				d = OptInt(s.duration_months);
				if (d != undefined){
					_date = new Date(startDate);
					nextMonth = (Month(_date) + d) % 12;
					nextMonth = nextMonth == 0 ? 12 : nextMonth;
					nextDay = Day(_date);
					nextYear = Year(_date);

					if ((Month(_date) + d) > 12) {
						nextYear = nextYear + 1;
					}

					if (nextMonth == 2 && nextDay > 28) {
						nextDay = 28;
						if ((nextYear % 4) == 0) { //високосный
							nextDay = 29;
						}
					}

					sobj.date = StrXmlDate(Date(nextDay + '.' + nextMonth + '.' + nextYear));
				}
			}
			obj.main_steps.push(sobj);
		}
		//


		// компетенции, задачи и темы
		var comps = XQuery("sql: \n\
			select cs.id, cs.name \n\
			from competences cs \n\
			inner join competence c on c.id = cs.id \n\
			inner join ( \n\
				select distinct(ics.competence_id) \n\
				from cc_idp_competences ics \n\
				where \n\
					ics.development_plan_id = " + dpId + " \n\
			) ics on ics.competence_id = cs.id \n\
		");

		for (c in comps) {
			_tasks = Task.list(dpId, c.id);
			//alert('_tasks: ' + tools.object_to_text(_tasks,  'json'));
			_themes = Theme.list(dpId, c.id);
			//alert('_themes: ' + tools.object_to_text(_themes,  'json'));
			obj.competences.push({
				id: Int(c.id),
				name: String(c.name),
				tasks: _tasks,
				themes: _themes
			});
		}


		// истории этапов
		obj.main_flows = XQuery("sql: \n\
			select \n\
				imfs.id, \n\
				cs1.fullname current_collaborator_fullname, \n\
				cs2.fullname next_collaborator_fullname, \n\
				iss.name idp_step_name, \n\
				imss.name idp_main_step_name, \n\
				imfs.comment, \n\
				imfs.created_date \n\
			from cc_idp_main_flows imfs \n\
			inner join cc_idp_mains ims on ims.id = imfs.idp_main_id \n\
			inner join collaborators cs1 on cs1.id = imfs.current_collaborator_id \n\
			inner join collaborators cs2 on cs2.id = imfs.next_collaborator_id \n\
			inner join cc_idp_steps iss on iss.id = imfs.idp_step_id \n\
			inner join cc_idp_main_steps imss on imss.id = imfs.idp_main_step_id \n\
			where \n\
				ims.development_plan_id = " + dpId + " \n\
			order by imfs.created_date desc \n\
		");
	}

	return obj;
}

function listByManager(
	assessmentAppraiseId,
	managerId,
	search,
	status,
	minRow,
	maxRow,
	pageSize,
	sort,
	sortDirection
) {
	var User = OpenCodeLib('./user.js');
	DropFormsCache('./user.js');

	var Utils = OpenCodeLib('./utils.js');
	DropFormsCache('./utils.js');

	var rs = User.roles();

	var l = "sql: \n\
		declare @s varchar(200) = '" + search + "'; \n\
		declare @state_id bigint = " + status + "; \n\
		\n\
		\n\
		select d.* \n\
		from ( \n\
			select \n\
				c.*, \n\
				row_number() over (order by c." + sort + " " + sortDirection + ") as [row_number] \n\
			from ( \n\
				select \n\
					count(dps.id) over() total, \n\
					dps.person_id, \n\
					dps.person_fullname, \n\
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
				left join cc_idp_moderators ims on ims.collaborator_id = dps.expert_person_id \n\
				left join cc_idp_roles irs on irs.id = ims.idp_role_id \n\
				where \n\
					dps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
					and dps.person_fullname like '%'+@s+'%' \n\
					and (cciss.id = @state_id or @state_id = 0) \n\
					and ( \n\
						dps.expert_person_id = " + managerId + " \n\
						--проверка на рук-ля \n\
						or ( \n\
							select count(ads.id) \n\
							from cc_assessment_delegates ads \n\
							where \n\
								ads.boss_delegate_id = " + managerId + " \n\
								and ads.assessment_appraise_id = " + assessmentAppraiseId + " \n\
						) > 0 \n\
						--проверка на модератора \n\
						or ( \n\
							ims.collaborator_id = " + managerId + " \n\
							and irs.code = '" + rs.moderator + "' \n\
						) \n\
						-- проверка на hrbp \n\
						or ( \n\
							select count(bts.code) \n\
							from func_managers fms \n\
							inner join boss_types bts on bts.id = fms.boss_type_id \n\
							where \n\
								fms.[person_id] = " + managerId + " \n\
								and bts.code = '" + rs.hrbp + "' \n\
						) > 0 \n\
					) \n\
				) c \n\
			) d \n\	
		where \n\
			d.[row_number] > " + minRow + " and d.[row_number] <= " + maxRow + " \n\
		order by d." + sort + " " + sortDirection

	var lq = XQuery(l);
	var larr = Utils.toJSArray(lq);
	/*for (el in larr) {
		_setComputedFields(el, user_id);
	}*/

	var total = 0;
	var fobj = ArrayOptFirstElem(lq);
	if (fobj != undefined) {
		total = fobj.total;
	}

	//var actions = _getModeratorActions(user_id);
	//var isModerator = Utils.isUserModerator(user_id);
	/*var obj = {
		meta: {
			total: Int(total),
			pageSize: pageSize,
			canAdd: (ArrayOptFind(actions, "This == 'add'") != undefined),
			isModerator: isModerator
		},
		topics: larr
	}*/

	var obj = {
		meta: {
			total: Int(total),
			pageSize: pageSize
		},
		list: larr
	}
	return obj;
}

function getThemesByCompetences(_competences, assessmentAppraiseId) {
	var comps = [];

	for (c in _competences) {
		try {
			compDoc = OpenDoc(UrlFromDocID(Int(c.competence_id)));

			cc = {
				id: String(c.competence_id),
				name: String(compDoc.TopElem.name),
				weight: String(c.weight),
				mark: String(c.mark),
				mark_text: String(c.mark_text),
				mark_value: String(c.mark_value),
				comment: String(c.comment),
				common_positive_comment: String(compDoc.TopElem.positive_comment),
				common_overdeveloped_comment: String(compDoc.TopElem.custom_elems.ObtainChildByKey('overdeveloped').value),
				common_negative_comment: String(compDoc.TopElem.negative_comment),
				common_comment: String(compDoc.TopElem.comment),
				themes: []
			}

			qct = XQuery("sql: \n\
				select \n\
					ccits.id theme_id, \n\
					ccits.[name] theme_name, \n\
					ccitls.[level] theme_level \n\
				from cc_idp_competence_themes ccicts \n\
				inner join cc_idp_themes ccits on ccits.id = ccicts.idp_theme_id \n\
				inner join cc_idp_theme_levels ccitls on ccitls.id = ccits.idp_theme_level_id \n\
				inner join cc_idp_assessment_levels ccials on ccials.idp_theme_level_id = ccitls.id \n\
				inner join cc_assessment_commons ccacs on ccacs.id = ccials.cc_assessment_common_id \n\
				where \n\
					ccicts.competence_id = " + c.competence_id + " \n\
					and ccicts.assessment_appraise_id = " + assessmentAppraiseId + " \n\
					and ccacs.scale = '" + String(c.mark_text) + "' \n\
			");


			for (ct in qct) {
				cc.themes.push({
					id: String(ct.theme_id),
					name: String(ct.theme_name),
					level: String(ct.theme_level)
				});
			}
			comps.push(cc);
		} catch(e) {}
	}

	return comps;
}


function getThemesByCompetencesByDpId(dpId, assessmentAppraiseId) {
	var paDoc = OpenDoc(UrlFromDocID(Int(paId)));
	var comps = [];

	for (c in paDoc.TopElem.competences) {
		try {
			compDoc = OpenDoc(UrlFromDocID(Int(c.competence_id)));

			cc = {
				id: String(c.competence_id),
				name: String(c.competence_id.OptForeignElem.name),
				weight: String(c.weight),
				mark: String(c.mark),
				mark_text: String(c.mark_text),
				mark_value: String(c.mark_value),
				comment: String(c.comment),
				common_positive_comment: String(compDoc.TopElem.positive_comment),
				common_overdeveloped_comment: String(compDoc.TopElem.custom_elems.ObtainChildByKey('overdeveloped').value),
				common_negative_comment: String(compDoc.TopElem.negative_comment),
				common_comment: String(compDoc.TopElem.comment),
				themes: []
			}

			qct = XQuery("sql: \n\
				select \n\
					ccits.id theme_id, \n\
					ccits.[name] theme_name, \n\
					ccitls.[level] theme_level \n\
				from cc_idp_competence_themes ccicts \n\
				inner join cc_idp_themes ccits on ccits.id = ccicts.idp_theme_id \n\
				inner join cc_idp_theme_levels ccitls on ccitls.id = ccits.idp_theme_level_id \n\
				inner join cc_idp_assessment_levels ccials on ccials.idp_theme_level_id = ccitls.id \n\
				inner join cc_assessment_commons ccacs on ccacs.id = ccials.cc_assessment_common_id \n\
				where \n\
					ccicts.competence_id = " + c.competence_id + " \n\
					and ccicts.assessment_appraise_id = " + assessmentAppraiseId + " \n\
					and ccacs.scale = '" + String(c.mark_text) + "' \n\
			");


			for (ct in qct) {
				cc.themes.push({
					id: String(ct.theme_id),
					name: String(ct.theme_name),
					level: String(ct.theme_level)
				});
			}
			comps.push(cc);
		} catch(e) {}
	}

	return comps;
}


function isAccessToUpdate(id, userId) {
	return true;
}

function isAccessToRemove(id, userId) {
	return true;
}

function isAccessToAdd(userId) {
	return true;
}