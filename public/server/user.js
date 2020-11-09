function isInSub(userId, subId, excludeSubIds, positions, excludePositions) {
	var joinSubs = ArrayMerge(ArrayUnion([subId], excludeSubIds), 'This', '),(');
	var joinPositions = StrReplace(StrLowerCase(ArrayMerge(positions, 'This', '\',\'')), ' ', '');
	var joinExcludePositions = StrReplace(StrLowerCase(ArrayMerge(excludePositions, 'This', '\',\'')), ' ', '');

	var q = XQuery("sql: \n\
		select c.* \n\
		from ( \n\
			select \n\
				cs.id, \n\
				cs.position_name, \n\
				c.p.query('id[text()[1]]').value('.', 'bigint') parent_sub_id \n\
			from collaborators cs \n\
			inner join collaborator cr on cr.id = cs.id \n\
			cross apply cr.data.nodes('/collaborator/path_subs/path_sub') as c(p) \n\
			where \n\
				cs.id = " + OptInt(userId) + " \n\
		) c \n\
		where \n\
			1=1 \n\
			" + (joinSubs.length > 0 ? "and c.parent_sub_id in (" + joinSubs + ")" : "") + " \n\
			" + (joinPositions.length > 0 ? "and replace(lower(c.position_name), ' ', '') in ('" + joinPositions + "')" : "") + " \n\
			" + (joinExcludePositions.length > 0 ? "and replace(lower(c.position_name), ' ', '') not in ('" + joinExcludePositions + "')" : "") + " \n\
	");

	return ArrayCount(q) == 1;
}

function getBlockGroup(userId, block) {
	var q = XQuery("sql: \n\
		select \n\
			ccabs.id, \n\
			gcs.collaborator_id \n\
		from cc_assessment_block_subs ccabs \n\
		inner join group_collaborators gcs on gcs.group_id = ccabs.[group] \n\
		where \n\
			ccabs.code = '" + block + "' \n\
			and gcs.collaborator_id = " + userId + " \n\
	");

	var belem = ArrayOptFirstElem(q);
	if (belem != undefined) {
		return OpenDoc(UrlFromDocID(Int(belem.id)));
	}
}

function getBlockSub(userId, block) {
	var sq = XQuery("sql: \n\
		select \n\
			ccabs.* \n\
		from cc_assessment_block_subs ccabs \n\
		where \n\
			ccabs.code = '" + block + "' \n\
	");

	//alert('sq: ' + tools.object_to_text(sq, 'json'));

	for (el in sq) {
		doc = OpenDoc(UrlFromDocID(el.id));
		_excSubs = ArrayExtractKeys(doc.TopElem.exclude_subdivisions, 'exclude_subdivision_id');
		//alert('_excSubs: ' + tools.object_to_text(_excSubs, 'json'));
	
		_positions = String(doc.TopElem.positions).split(',');
		//alert('_positions: ' + tools.object_to_text(_positions, 'json'));

		_excludePositions = String(doc.TopElem.exclude_positions).split(',');
		//alert('_excludePositions: ' + tools.object_to_text(_excludePositions, 'json'));

		inSub = isInSub(userId, OptInt(el.subdivision), _excSubs, _positions, _excludePositions);

		if (inSub) {
			return doc;
		}
	}
}

function hasPa(userId, assessmentAppraiseId) {
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

function isBoss(userId) {
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			distinct(cs.id) \n\
		from collaborators cs \n\
		inner join func_managers fm on fm.person_id = cs.id \n\
		inner join boss_types bt on bt.id = fm.boss_type_id  \n\
		where \n\
			cs.id = " + userId + " \n\
			and cs.is_dismiss = 0 \n\
			and bt.code = 'main' \n\
	"));

	return q != undefined;
}

function getBoss(userId) {
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

function getActions(userId, objectType) {
	var actions = [];

	var actionsq = XQuery("sql: \n\
		select ccia.action \n\
		from cc_assessment_roles ccir \n\
		inner join cc_assessment_moderators ccim on ccim.role_id = ccir.id \n\
		inner join cc_assessment_actions ccia on ccia.role_id = ccim.role_id \n\
		where \n\
			ccim.user_id = " + userId + " \n\
			and ccia.object_type = '" + objectType + "'");

	for (el in actionsq) {
		actions.push(String(el.action));
	}

	return actions;
}

function getPas(userId, status, assessmentAppraiseId) {
	var Assessment = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/assessment.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/assessment.js');

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
		try {
			objPa = Assessment.getPa(p.id);
			result.push(objPa);
		} catch(e) {}
	}

	return result;
}

function getManager(userId, assessmentAppraiseId){
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

function getUser(userId, assessmentAppraiseId) {
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

	return ArrayOptFirstElem(q);
}

function getSubordinates(userId, assessmentAppraiseId, search, minRow, maxRow, pageSize) {
	var Assessment = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/assessment.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/assessment.js');

	var sq = XQuery("sql: \n\
		declare @s varchar(300) = '" + search + "'; \n\
		select d.* \n\
		from ( \n\
			select \n\
				c.*, \n\
				row_number() over (order by c." + sort + " " + sortDirection + ") as [row_number] \n\
			from ( \n\
				select \n\
					count(c.id) over() total, \n\
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
					c.fullname like '%'+@s+'%' \n\
					and p.expert_person_id = " + userId + " \n\
					and p.person_id <> " + userId + " \n\
					and p.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			) c \n\
		) d \n\
		where \n\
			d.[row_number] > " + minRow + " and d.[row_number] <= " + maxRow + " \n\
		order by d." + sort + " " + sortDirection
	);

	var result = [];
	for (s in sq){
		plan = Assessment.getAssessmentPlan(String(s.id), assessmentAppraiseId);
		data = {
			id: String(s.id),
			fullname: String(s.fullname),
			position: String(s.position),
			department: String(s.department),
			assessment: {}
		}

		if (plan != undefined){
			data.assessment = {
				step: String(plan.step),
				stepName: String(plan.stepName),
				overall: String(s.overall)
			}
		}

		result.push(data);
	}

	var total = 0;
	var fobj = ArrayOptFirstElem(sq);
	if (fobj != undefined) {
		total = fobj.total;
	}

	return {
		meta: {
			total: Int(total),
			pageSize: pageSize
		},
		subordinates: result
	}
}

function getAssessmentBossId(userId, assessmentAppraiseId){
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select ap.boss_id \n\
		from assessment_plans ap \n\
		where \n\
			person_id = " + userId + " \n\
			and ap.assessment_appraise_id = " + assessmentAppraiseId
	));
	return q == undefined ? q : q.boss_id;
}