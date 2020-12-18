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


function getObject(dpId, assessmentAppraiseId) {
	var User = OpenCodeLib('x-local://wt/web/vsk/portal/idp/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/idp/server/user.js');

	var Task = OpenCodeLib('x-local://wt/web/vsk/portal/idp/server/task.js');
	DropFormsCache('x-local://wt/web/vsk/portal/idp/server/task.js');

	var obj = {
		managers: [],
		main_steps: [],
		competences: [],
		task_flows: []
	}

	var qdp = ArrayOptFirstElem(
		XQuery("sql: \n\
			select \n\
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
		obj.main_step_id = OptInt(qdp.main_step_id);
		obj.main_step_name = String(qdp.main_step_name);
		obj.state_id = OptInt(qdp.state_id);
		obj.state_name = String(qdp.state_name);


		// руководители
		obj.managers = User.getManagers(qdp.person_id, assessmentAppraiseId);

		// общие этапы
		var mainSteps = getMainSteps();
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

		// компетенции и задачи
		var comps = XQuery("sql: \n\
			select distinct(its.competence_id) competence_id, cs.name competence_name\n\
			from cc_idp_tasks its\n\
			inner join competences cs on cs.id = its.competence_id \n\
			where \n\
				its.development_plan_id = " + dpId + " \n\
		");

		for (c in comps) {
			_tasks = Task.list(dpId, c.competence_id);
			obj.competences.push({
				id: Int(c.competence_id),
				name: String(c.competence_name),
				tasks: _tasks
			});
		}
		//

		// истории этапов по каждой задаче
		obj.task_flows = XQuery("sql: \n\
			select \n\
				cs.id competence_id, \n\
				cs.name competence_name, \n\
				itfs.id, \n\
				itfs.idp_task_id task_id, \n\
				its.description task_description, \n\
				itfs.current_collaborator_id, \n\
				cs1.fullname current_collaborator_fullname, \n\
				itfs.next_collaborator_id, \n\
				cs2.fullname next_collaborator_fullname, \n\
				itfs.idp_step_id step_id, \n\
				iss.name step_name, \n\
				itfs.idp_main_step_id main_step_id, \n\
				imss.name main_step_name, \n\
				itfs.comment, \n\
				itfs.created_date, \n\
				itfs.is_active_step \n\
			from cc_idp_task_flows itfs \n\
			inner join cc_idp_tasks its on its.id = itfs.idp_task_id \n\
			inner join competences cs on cs.id = its.competence_id \n\
			inner join collaborators cs1 on cs1.id = itfs.current_collaborator_id \n\
			inner join collaborators cs2 on cs2.id = itfs.next_collaborator_id \n\
			inner join cc_idp_steps iss on iss.id = itfs.idp_step_id \n\
			inner join cc_idp_main_steps imss on imss.id = itfs.idp_main_step_id \n\
			where its.development_plan_id = " + dpId + " \n\
			order by itfs.created_date desc \n\
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
	var User = OpenCodeLib('x-local://wt/web/vsk/portal/idp/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/idp/server/user.js');

	var Utils = OpenCodeLib('x-local://wt/web/vsk/portal/idp/server/utils.js');
	DropFormsCache('x-local://wt/web/vsk/portal/idp/server/utils.js');

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


function getCompetencesAndThemes(paId, assessmentAppraiseId) {
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
				competence_themes: []
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

			alert("sql: \n\
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
				cc.competence_themes.push({
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




function getCrByPersonId(personId){
	return XQuery("for $el in career_reserves where $el/person_id = " + personId + " return $el");
}

function getAssessments(){
	return XQuery("sql: \n\
		select \n\
			convert(varchar(max), aas.id) id, \n\
			aas.name, \n\
			aas.description, \n\
			aas.color, \n\
			aas.[percent] \n\
		from cc_adaptation_assessments aas \n\
	");
}

function getNextUserId(crId, role){
	var User = OpenCodeLib('x-local://wt/web/vsk/portal/adaptation/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/adaptation/server/user.js');

	var doc = OpenDoc(UrlFromDocID(Int(crId)));

	var udoc = OpenDoc(UrlFromDocID(Int(doc.TopElem.person_id)));
	var isAdaptation = ArrayOptFind(udoc.TopElem.custom_elems, 'This.name == \'is_adaptation\'');
	if (isAdaptation != undefined){
		var types = User.getManagerTypes();
		if (isAdaptation.value == 'true' && types.user == role) {
			return doc.TopElem.person_id;
		}
	}

	for (el in doc.TopElem.tutors){
		if (el.boss_type_id.OptForeignElem.code == role){
			return el.person_id;
		}
	}

	return null;
}


function getById(crId){
	return ArrayOptFirstElem(XQuery('for $el in career_reserves where $el/id = ' + crId + ' return $el'));
}

function isAccessToView(userId, doc, crid){
	if (doc == null){
		doc = OpenDoc(UrlFromDocID(Int(crid)));
	}

	var User = OpenCodeLib('x-local://wt/web/vsk/portal/adaptation/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/adaptation/server/user.js');
	
	var urole = User.getRole(userId, doc.DocID, doc);
	return (
		(doc.TopElem.person_id == userId) ||
		(ArrayOptFind(doc.TopElem.tutors, 'This.person_id == ' + userId) != undefined) ||
		urole == 'admin'
	);
}

function getCurators(userId, userRole){
	var User = OpenCodeLib('x-local://wt/web/vsk/portal/adaptation/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/adaptation/server/user.js');

	var bossTypes = User.getManagerTypes();
	// если админ, то должен видеть всех кураторов

	return XQuery("sql: \n\
		select \n\
			distinct(cs.id) tutor_id, \n\
			cs.fullname + ' (' + cs.position_name + ')' [name] \n\
		from ( \n\
			select \n\
				c.career_reserve_id, \n\
				t.p.query('person_id').value('.','varchar(50)') tutor_id, \n\
				t.p.query('boss_type_id').value('.','varchar(50)') boss_type_id \n\
			from career_reserves crs \n\
			inner join ( \n\
				select \n\
					crt.career_reserve_id, \n\
					crt.tutor_id \n\
				from career_reserve_tutors crt \n\
				where (crt.tutor_id = " + userId + ") \n\
				--where (crt.tutor_id = " + userId + " or 'admin' = '" + userRole + "') \n\
			) c on c.career_reserve_id = crs.id \n\
			inner join career_reserve cr on cr.id = crs.id \n\
			cross apply cr.data.nodes('/career_reserve/tutors/tutor') as t(p) \n\
			where t.p.exist('person_id[text()[1] = " + userId + "]') <> 1 \n\
		) c \n\
		inner join boss_types bt on bt.id = c.boss_type_id \n\
		inner join collaborators cs on cs.id = c.tutor_id \n\
		where \n\
			bt.code = '" + bossTypes.curator + "' \n\
			and tutor_id <> " + userId + " \n\
	");
}