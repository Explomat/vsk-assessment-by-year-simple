function _setComputedFields(curUserID, userId, bossId, step) {
	var User = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');

	var actions = User.getActions(curUserID, 'pa');
	var updateAction = (ArrayOptFind(actions, 'This == "update"') != undefined);

	return {
		curUserID: curUserID,
		canEditSelf: ((curUserID == userId && String(step) == '1') || updateAction != undefined),
		canEditBoss: ((curUserID == bossId && String(step) == '2') || updateAction != undefined)
	}
}

function create(userId, assessmentAppraiseId, blockId) {
	var User = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');

	var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
	var bsettings = Settings.baseSettings(assessmentAppraiseId);

	/*var isBoss = User.isBoss(userId);
	var profileId = isBoss ? bsettings.GetOptProperty('manager_competence_profile_id') : bsettings.GetOptProperty('self_competence_profile_id');
	if (profileId == undefined) {
		throw 'Не найден профиль вашей оценки.';
	}

	var profileCompetences = OpenDoc(UrlFromDocID(profileId)).TopElem.competences;*/
	var userBoss = User.getBoss(userId);
	var userBossId = userBoss != undefined ? userBoss.person_id : null;

	//план оценки
	var docPlan = tools.new_doc_by_name('assessment_plan');
	docPlan.TopElem.assessment_appraise_id = bsettings.assessment_appraise_id;
	docPlan.TopElem.boss_id = userBossId;
	docPlan.TopElem.workflow_id = bsettings.workflow_id;
	docPlan.TopElem.workflow_state = 1;
	docPlan.TopElem.person_id = userId;
	docPlan.BindToDb(DefaultDb);
	docPlan.Save();

	//самооценка
	var docSelf = tools.new_doc_by_name('pa');
	docSelf.TopElem.assessment_appraise_type = 'competence_appraisal';
	//docSelf.TopElem.competence_profile_id = profileId;
	docSelf.TopElem.status = 'self';
	docSelf.TopElem.assessment_appraise_id = bsettings.assessment_appraise_id;
	docSelf.TopElem.workflow_id = bsettings.workflow_id;
	docSelf.TopElem.workflow_state = 1;
	docSelf.TopElem.person_id = userId;
	docSelf.TopElem.expert_person_id = userId;

	var comps = XQuery("sql: \n\
		select c.id \n\
		from competences c \n\
		where c.competence_block_id = " + blockId + " \n\
	");
	for (el in comps) {
		compChild = docSelf.TopElem.competences.AddChild();
		compChild.competence_id = el.id;
		compChild.weight = 0;

		inds = XQuery("sql: \n\
			select ids.id \n\
			from indicators ids \n\
			where ids.competence_id = " + el.id + " \n\
		");

		for (ind in inds) {
			indChild = compChild.indicators.AddChild();
			compChild.indicator_id = ind.id;
			compChild.weight = 0;
		}
	}

	//docSelf.TopElem.competences.AssignElem(profileCompetences);
	docSelf.TopElem.assessment_plan_id = docPlan.DocID;
	docSelf.BindToDb(DefaultDb);
	docSelf.Save();

	return docSelf;
}

function complete(userId, assessmentAppraiseId) {
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select pas.id \n\
		from \n\
			pas \n\
		where \n\
			pas.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and pas.person_id = " + userId + " \n\
			and pas.expert_person_id = " + userId
	));

	if (q != undefined){
		var paCard = OpenDoc(UrlFromDocID(Int(q.id)));
		paCard.TopElem.is_done = true;

		var wDoc = OpenDoc(UrlFromDocID(Int(paCard.TopElem.workflow_id)));
		var wstateElem = ArrayOptFind(wDoc.TopElem.states, 'This.code == ' + 4);

		//paCard.TopElem.comment = comment;
		paCard.TopElem.workflow_state = 4;
		paCard.TopElem.workflow_state_name = (wstateElem != undefined ? wstateElem.name : '');
		paCard.Save();

		var docPlan = OpenDoc(UrlFromDocID(paCard.TopElem.assessment_plan_id));
		docPlan.TopElem.workflow_state = 4;
		docPlan.TopElem.is_done = true;
		docPlan.Save();
	}
}

function update(paId, _competences, overall, wstate) {
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
	curPaCard.TopElem.workflow_state = wstate;

	var wDoc = OpenDoc(UrlFromDocID(Int(curPaCard.TopElem.workflow_id)));
	var wstateElem = ArrayOptFind(wDoc.TopElem.states, 'This.code == ' + wstate);

	curPaCard.TopElem.workflow_state_name = (wstateElem != undefined ? wstateElem.name : '');;
	curPaCard.Save();

	var docPlan = OpenDoc(UrlFromDocID(curPaCard.TopElem.assessment_plan_id));
	docPlan.TopElem.workflow_state = wstate;
	docPlan.Save();

	return curPaCard;
}

function getAssessmentPlan(userId, assessmentAppraiseId){
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

function getCommonCompetences(assessmentAppraiseId) {

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
				p.assessment_appraise_id = " + assessmentAppraiseId + ") cid \n\
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

function getPa(paId){
	var doc = OpenDoc(UrlFromDocID(Int(paId)));

	var objPa = {
		id: String(doc.TopElem.id),
		workflowState: String(doc.TopElem.workflow_state),
		workflowStateName: String(doc.TopElem.workflow_state_name),
		statusName: String(doc.TopElem.status.OptForeignElem.name),
		status: String(doc.TopElem.status),
		overall: String(doc.TopElem.overall),
		competences: []
	};

	for (c in doc.TopElem.competences){
		cc = {
			pa_id: String(paId),
			competence_id: String(c.competence_id),
			weight: String(c.weight),
			mark_text: String(c.mark_text),
			mark_value: String(c.mark_value),
			comment: String(c.comment),
			indicators: []
		}

		for (i in c.indicators){
			cc.indicators.push({
				pa_id: String(paId),
				indicator_id: String(i.indicator_id),
				weight: String(i.weight),
				mark_text: String(i.mark_text),
				mark_value: String(i.mark_value),
				comment: String(i.comment)
			});
		}
		objPa.competences.push(cc);
	}
	return objPa;
}

function getBlocksTree(rootBlockId, isChilds) {

	function getChildren(blockId) {
		return XQuery("sql: \n\
			select cbs.id, cbs.name, cbs.parent_object_id \n\
			from competence_blocks cbs \n\
			where parent_object_id = " + blockId
		);
	}

	function newBlock(el) {
		return {
			id: OptInt(el.id),
			name: String(el.name),
			parent_object_id: OptInt(el.parent_object_id),
			children: []
		}
	}

	var children = getChildren(rootBlockId);
	var queue = [];

	for (el in children) {
		queue.push(newBlock(el));
	}

	var _isChilds = isChilds != undefined ? isChilds : true;
	if (!_isChilds) {
		return queue;
	}

	var result = [];
	while(queue.length > 0) {
		node = ArrayOptFirstElem(queue);
		node.children = [];
		queue.splice(0, 1);

		children = getChildren(node.id);
		for (el in children) {
			ch = newBlock(el);
			queue.push(ch);
			node.children.push(ch);
		}

		if (ArrayCount(children) > 0) {
			result.push(node);
		}
	}

	return result;
}