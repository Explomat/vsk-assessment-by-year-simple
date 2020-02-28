function _isContains(_ids, _id) {
	for (i = _ids.length - 1; i >= 0; i--) {
		if (_ids[i] == _id) {
			return true;
		}
	}

	return false;
}

function notificate(templateCode, primaryId, secondaryId, text){
	var ids = [6605156524408652638];
	if (!_isContains(ids, primaryId)) {
		tools.create_notification(templateCode, primaryId, text, secondaryId);
	}
}

function instruction(assessmentAppraiseId) {
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			t.p.query('text_area').value('.','varchar(MAX)') as instruction \n\
		from \n\
			documents ds \n\
		join document d on d.id = ds.id \n\
		cross apply d.data.nodes('/document') AS t(p) \n\
		where \n\
			ds.id in ( \n\
				select \n\
					t.p.query('manual_document_id').value('.','varchar(250)') as doc_id \n\
				from \n\
					assessment_appraises aas \n\
				join \n\
					assessment_appraise aa on aa.id = aas.id \n\
				cross apply aa.data.nodes('/assessment_appraise') AS t(p) \n\
				where \n\
					aas.id = " + assessmentAppraiseId + " \n\
				)"
	));
	return q == undefined ? '' : q.instruction;
}

function isUserHasPa(userId, assessmentAppraiseId) {

	var pa = ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			id \n\
		from pas \n\
		where \n\
			pas.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and pas.person_id = " + userId 
	));

	return pa != undefined;
}

function getBossById(userId) {
	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			distinct(cs.id), \n\
			cs.code, \n\ 
			cs.fullname, \n\
			cs.position_name, \n\
			cs.position_parent_name, \n\
			cs.position_parent_id \n\
		from collaborators cs \n\
		inner join func_managers fm on fm.person_id = cs.id \n\
		inner join boss_types bt on bt.id = fm.boss_type_id  \n\
		where \n\
			cs.id = " + userId + " \n\
			and cs.is_dismiss = 0 \n\
			and bt.code = 'main' \n\
	"));
}

function getUserBoss(userId) {
	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			fm.person_id, \n\
			fm.person_fullname \n\
		from func_managers fm \n\
		inner join boss_types bt on bt.id = fm.boss_type_id \n\
		inner join collaborators cs on cs.id = fm.object_id \n\
		where \n\
			fm.object_id = " + userId + " \n\
			and cs.is_dismiss = 0 \n\
			and bt.code = 'main' \n\
	"));
}

function assessmentPlanForUser(userId, assessmentAppraiseId){
	var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');

	var bsettings = Settings.baseSettings(assessmentAppraiseId);

	var q = XQuery("sql: \n\
		select \n\
		ap.workflow_state as step, \n\
		ap.integral_mark as overall, \n\
		w.name as stepName \n\
	from \n\
		assessment_plans ap, \n\
		(select \n\
			ws.id, \n\
			t.p.query('code').value('.','varchar(250)') as code, \n\
			t.p.query('name').value('.','varchar(250)') as name \n\
		from workflows ws \n\
		inner join workflow w on w.id = ws.id \n\
		cross apply w.data.nodes('/workflow/states/state') AS t(p) \n\
		where ws.id = " + bsettings.workflow_id + ") w \n\
	where \n\
		ap.person_id = " + userId + " \n\
		and ap.assessment_appraise_id = " + bsettings.assessment_appraise_id + " \n\
		and ap.workflow_id = w.id \n\
		and ap.workflow_state = w.code \n\
	");

	return ArrayOptFirstElem(q);
}

function statusNameByStatusId(statusId){
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select p.name \n\
		from [common.assessment_appraise_participants] p \n\
		where p.id = '" + statusId + "'"
	));
	return q == undefined ? q : q.name;
}

function pasForUser(userId, status, assessmentAppraiseId){

	var qs = "select pas.id \n\
		from \n\
			pas \n\
		where \n\
			pas.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and pas.person_id = " + userId

	if (status != undefined){
		qs = qs + " and pas.status = '" + status + "'";
	}

	var q = XQuery("sql:" + qs);

	var result = [];
	for (p in q){
		doc = OpenDoc(UrlFromDocID(Int(p.id)));
		statusName = statusNameByStatusId(String(doc.TopElem.status));
		d = {
			id: String(doc.TopElem.id),
			workflowState: String(doc.TopElem.workflow_state),
			workflowStateName: String(doc.TopElem.workflow_state_name),
			statusName: String(statusName),
			status: String(doc.TopElem.status),
			overall: String(doc.TopElem.overall),
			competences: []
		};

		for (c in doc.TopElem.competences){
			cc = {
				pa_id: String(p.id),
				competence_id: String(c.competence_id),
				weight: String(c.weight),
				mark_text: String(c.mark_text),
				mark_value: String(c.mark_value),
				comment: String(c.comment),
				indicators: []
			}

			for (i in c.indicators){
				cc.indicators.push({
					pa_id: String(p.id),
					indicator_id: String(i.indicator_id),
					weight: String(i.weight),
					mark_text: String(i.mark_text),
					mark_value: String(i.mark_value),
					comment: String(i.comment)
				});
			}
			d.competences.push(cc);
		}
		result.push(d);
	}
	return result;
}

function managerForUser(userId, assessmentAppraiseId){
	var q = XQuery("sql: \n\
		select \n\
			c.id, \n\
			c.fullname, \n\
			c.position_name as position, \n\
			c.position_parent_name as department \n\
		from \n\
			collaborators c, \n\
			( \n\
				select ap.boss_id \n\
				from pas p \n\
				join assessment_plans ap on ap.id = p.assessment_plan_id \n\
				where  \n\
					p.person_id = " + userId + " \n\
					and p.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			) p \n\
		where \n\
			c.id = p.boss_id \n\
	")

	return ArrayOptFirstElem(q);
}

function user(userId, assessmentAppraiseId){

	var q = XQuery("sql: \n\
		select \n\
			c.id, \n\
			c.fullname, \n\
			c.position_name as position, \n\
			c.position_parent_name as department, \n\
			m.[count] \n\
		from \n\
			collaborators c, \n\
			( \n\
				select count(*) as [count] \n\
				from assessment_plans ap \n\
				where \n\
					ap.boss_id = " + userId + " \n\
					and ap.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			) m \n\
		where \n\
			c.id = " + userId
	);
	var u = ArrayOptFirstElem(q);
	if (u != undefined){
		return {
			id: String(u.id),
			fullname: String(u.fullname),
			position: String(u.position),
			department: String(u.department),
			isManager: OptInt(u.count) >= 1
		}
	}
}

function subordinatesForUser(userId, assessmentAppraiseId) {
	var q = XQuery("sql: \n\
		select \n\
			c.id, \n\
			c.fullname, \n\
			c.position_name as position, \n\
			c.position_parent_name as department, \n\
			p.overall \n\
		from \n\
			collaborators c \n\
		join \n\
			pas p on p.person_id = c.id \n\
		where \n\
			p.expert_person_id = " + userId + " \n\
			and p.person_id <> " + userId + " \n\
			and p.assessment_appraise_id = " + assessmentAppraiseId
	);

	var result = [];
	for (s in q){
		plan = assessmentPlanForUser(String(s.id), assessmentAppraiseId);
		data = {
			id: String(s.id),
			fullname: String(s.fullname),
			position: String(s.position),
			department: String(s.department),
			avatarUrl: ''
		}
		if (plan != undefined){
			data.assessment = {
				step: String(plan.step),
				stepName: String(plan.stepName),
				overall: String(s.overall)
			}
		} else {
			data.assessment = {};
		}

		result.push(data);
	}
	return result;
}

function commonCompetences(userId, assessmentAppraiseId) {
	//alert('-----------------utils.js---------------------');
	var q = XQuery("sql: \n\
		select cid.competence_id, cs.name \n\
		from \n\
			(select distinct\n\
				t.p.query('competence_id').value('.','varchar(250)') competence_id \n\
			from competence_profiles cps \n\
			join pas p on p.competence_profile_id = cps.id \n\
			join competence_profile cp on cp.id = cps.id \n\
			cross apply cp.data.nodes('/competence_profile/competences/competence') AS t(p) \n\
			where \n\
				p.person_id = " + userId + " \n\
				and p.assessment_appraise_id = " + assessmentAppraiseId + ") cid \n\
		join competences cs on cs.id = cid.competence_id \n\
	"); 

	var result = [];
	for (cp in q){
		comp = {
			id: String(cp.competence_id),
			name: String(cp.name),
			scales: [],
			commonIndicators: []
		}

		cDoc = OpenDoc(UrlFromDocID(Int(cp.competence_id)));
		for (s in cDoc.TopElem.scales){
			comp.scales.push({
				id: String(s.id),
				name: String(s.name),
				percent: String(s.percent),
				desc: String(s.desc),
				comment_require: String(s.comment_require)
			});
		}


		qi = XQuery("sql: \n\
			select i.id \n\
			from indicators i \n\
			where i.competence_id = " + cp.competence_id
		);
		for (i in qi){
			iDoc = OpenDoc(UrlFromDocID(Int(i.id)));

			ind = {
				id: String(i.id),
				competence_id: String(iDoc.TopElem.competence_id),
				name: String(iDoc.TopElem.name),
				scales: []
			}
			for (s in iDoc.TopElem.scales){
				ind.scales.push({
					id: String(s.id),
					name: String(s.name),
					percent: String(s.percent),
					desc: String(s.desc),
					comment_require: String(s.comment_require)
				});
			}

			comp.commonIndicators.push(ind);
		}
		result.push(comp);
	}
	return result;
}

function docWvars(id){
	var doc = OpenDoc(UrlFromDocID(Int(id)));

	var legends = ArrayOptFind(doc.TopElem.wvars, "This.name == 'assessment_by_year.legends'");
	var colors = ArrayOptFind(doc.TopElem.wvars, "This.name == 'assessment_by_year.colors'");
	var percents = ArrayOptFind(doc.TopElem.wvars, "This.name == 'assessment_by_year.percents'");


	var result = [];
	for (l in legends.entries) {
		obj = {
			scale: String(l.id),
			description: String(l.name)
		}

		cEntrie = ArrayOptFind(colors.entries, "This.id == '" + l.id + "'");
		obj.color = String(cEntrie.name);

		pEntrie = ArrayOptFind(percents.entries, "This.id == '" + l.id + "'");
		obj.percent = String(pEntrie.name);
		result.push(obj);
	}

	return result;
}

function assessmentBossByUser(userId, assessmentAppraiseId){
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select ap.boss_id \n\
		from assessment_plans ap \n\
		where \n\
			person_id = " + userId + " \n\
			and ap.assessment_appraise_id = " + assessmentAppraiseId
	));
	return q == undefined ? q : q.boss_id;
}

/*function assessmentPlanByUser(userId){
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select pas.assessment_plan_id \n\
		from pas \n\
		where \n\
			pas.person_id = " + userId + " \n\
			and pas.expert_person_id = " + userId + " \n\
			and pas.assessment_appraise_id = " + assessment_appraise_id
	));
	return q == undefined ? q : q.assessment_plan_id;
}
*/
/*function assessmentStepByUser(userId){
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select ap.workflow_state as step \n\
		from pas \n\
		join assessment_plans ap on ap.id = pas.assessment_plan_id \n\
		where \n\
			pas.person_id = " + userId + " \n\
			and pas.expert_person_id = " + userId + " \n\
			and pas.assessment_appraise_id = " + assessment_appraise_id
	));
	return q == undefined ? q : q.step;
}*/

/*function paSelfByUser(userId){
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select pas.id \n\
		from pas \n\
		where \n\
			pas.person_id = " + userId + " \n\
			and pas.expert_person_id = " + userId + " \n\
			and pas.assessment_appraise_id = " + assessment_appraise_id
	));
	return q == undefined ? q : q.id;
}*/