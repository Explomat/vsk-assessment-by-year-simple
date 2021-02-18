﻿function isInSub(userId, subId, excludeSubIds, positions, excludePositions, excludeCollaborators) {
	var joinSubs = ArrayMerge(ArrayUnion([subId], excludeSubIds), 'This', ',');
	var joinPositions = StrReplace(StrReplace(StrLowerCase(ArrayMerge(positions, 'This', '\',\'')), ' ', ''), '-', '');
	var joinExcludePositions = StrReplace(StrReplace(StrLowerCase(ArrayMerge(excludePositions, 'This', '\',\'')), ' ', ''), '-', '');
	var joinExcludeCollaborators = ArrayMerge(excludeCollaborators, 'This', ',');

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
			" + (joinExcludeCollaborators.length > 0 ? "and c.id not in (" + joinExcludeCollaborators + ")" : "") + " \n\
	");

	return ArrayCount(q) == 1;
}

function isInSubs(userId, lsubs, positions, excludePositions, excludeCollaborators) {
	//var joinSubs = ArrayMerge(ArrayUnion([subId], excludeSubIds), 'This', ',');
	var joinSubs = ArrayMerge(lsubs, 'This', ',');
	var joinPositions = StrReplace(StrReplace(StrLowerCase(ArrayMerge(positions, 'This', '\',\'')), ' ', ''), '-', '');
	var joinExcludePositions = StrReplace(StrReplace(StrLowerCase(ArrayMerge(excludePositions, 'This', '\',\'')), ' ', ''), '-', '');
	var joinExcludeCollaborators = ArrayMerge(excludeCollaborators, 'This', ',');

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
			" + (joinExcludeCollaborators.length > 0 ? "and c.id not in (" + joinExcludeCollaborators + ")" : "") + " \n\
	");

	/*alert("sql: \n\
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
			" + (joinExcludeCollaborators.length > 0 ? "and c.id not in (" + joinExcludeCollaborators + ")" : "") + " \n\
	");*/
	return ArrayCount(q) == 1;
}

function getBlockGroup(blockCode, assessmentAppraiseId) {
	var q = XQuery("sql: \n\
		select \n\
			ccabs.id \n\
		from cc_assessment_block_subs ccabs \n\
		where \n\
			ccabs.code = '" + blockCode + "' \n\
			and ccabs.assessment_appraise_id = " + assessmentAppraiseId + " \n\
	");

	var belem = ArrayOptFirstElem(q);
	if (belem != undefined) {
		return OpenDoc(UrlFromDocID(Int(belem.id)));
	}
}

function getBlockGroupByUserId(userId, blockCode, assessmentAppraiseId) {
	var q = XQuery("sql: \n\
		select \n\
			ccabs.id, \n\
			gcs.collaborator_id \n\
		from cc_assessment_block_subs ccabs \n\
		inner join group_collaborators gcs on gcs.group_id = ccabs.[group] \n\
		where \n\
			ccabs.code = '" + blockCode + "' \n\
			and gcs.collaborator_id = " + userId + " \n\
			and ccabs.assessment_appraise_id = " + assessmentAppraiseId + " \n\
	");

	var belem = ArrayOptFirstElem(q);
	if (belem != undefined) {
		return OpenDoc(UrlFromDocID(Int(belem.id)));
	}
}

function getBlockSubByUserId(userId, blockCode, assessmentAppraiseId) {
	var sq = XQuery("sql: \n\
		select \n\
			ccabs.* \n\
		from cc_assessment_block_subs ccabs \n\
		where \n\
			ccabs.code = '" + blockCode + "' \n\
			and ccabs.assessment_appraise_id = " + assessmentAppraiseId +" \n\
		order by number desc \n\
	");

	var Utils = OpenCodeLib('./utils.js');
	DropFormsCache('./utils.js');

	var settingsDoc = Utils.getSystemSettings(assessmentAppraiseId);
	var _excCollaborators = ArrayExtractKeys(settingsDoc.TopElem.exclude_collaborators, 'exclude_collaborator_id');
	//alert('sq: ' + tools.object_to_text(sq, 'json'));

	for (el in sq) {
		//alert(blockCode);
		doc = OpenDoc(UrlFromDocID(el.id));
		_excSubs = ArrayExtractKeys(doc.TopElem.exclude_subdivisions, 'exclude_subdivision_id');
		//alert('_excSubs: ' + tools.object_to_text(_excSubs, 'json'));
	
		_positions = String(doc.TopElem.positions).split(',');
		//alert('_positions: ' + tools.object_to_text(_positions, 'json'));

		_excludePositions = String(doc.TopElem.exclude_positions).split(',');
		//alert('_excludePositions: ' + tools.object_to_text(_excludePositions, 'json'));

		//inSub = isInSub(userId, OptInt(el.subdivision), _excSubs, _positions, _excludePositions, _excCollaborators);
		_lsubs = ArrayExtractKeys(doc.TopElem.lsubdivisions, 'lsubdivision_id');
		inSub = isInSubs(userId, _lsubs, _positions, _excludePositions, _excCollaborators);
		if (inSub) {
			//alert('inSub: ' + blockCode);
			return doc;
		}
	}
}

function searchBlockSub(userId, assessmentAppraiseId) {
	var sq = XQuery("sql: \n\
		select code \n\
		from cc_assessment_block_subs \n\
		where \n\
			--subdivision is not null \n\
			assessment_appraise_id = " + assessmentAppraiseId + " \n\
	");

	for (el in sq) {
		s1 = getBlockSubByUserId(userId, String(el.code), assessmentAppraiseId);
		if (s1 != undefined) {
			return s1;
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

function getBoss(userId, assessmentAppraiseId) {
	var delegate = ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			ccads.boss_delegate_id person_id \n\
		from cc_assessment_delegates ccads \n\
		where \n\
			ccads.[user_id] = " + userId + " \n\
			and ccads.assessment_appraise_id = " + assessmentAppraiseId + " \n\
	"));

	if (delegate != undefined) {
		return delegate;
	}

	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			fm.person_id \n\
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
	var Assessment = OpenCodeLib('./assessment.js');
	DropFormsCache('./assessment.js');

	var qs = "select pas.id \n\
		from \n\
			pas \n\
		where \n\
			pas.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and pas.person_id = " + userId

	if (status != undefined){
		qs = qs + " and pas.status = '" + status + "'";
	}


	//alert(qs);
	var q = XQuery("sql:" + qs);
	var result = [];

	for (p in q){
		try {
			objPa = Assessment.getPa(p.id);
			result.push(objPa);
		} catch(e) { alert(e); }
	}

	//alert(tools.object_to_text(result, 'json'));
	return result;
}

function getManagers(userId, assessmentAppraiseId){
	var mq = XQuery("sql: \n\
		select \n\
			aps.id assessment_plan_id, \n\
			cs.id, \n\
			cs.fullname, \n\
			cs.email, \n\
			cs.position_name position, \n\
			cs.position_parent_name department, \n\
			'Делегирование оценки' boss_type_name \n\
		from collaborators cs \n\
		inner join assessment_plans aps on aps.boss_id = cs.id \n\
		where \n\
			aps.person_id = " + userId + " \n\
			and aps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
		union \n\
		select \n\
			null assessment_plan_id, \n\
			cs.id, \n\
			cs.fullname, \n\
			cs.email, \n\
			cs.position_name position, \n\
			cs.position_parent_name department, \n\
			bts.name boss_type_name \n\
		from collaborators cs \n\
		left join func_managers fm on fm.person_id = cs.id \n\
		left join boss_types bts on bts.id = fm.boss_type_id \n\
		where \n\
			fm.[object_id] = " + userId + " \n\
			and ( \n\
				bts.code = 'main' \n\
				or bts.id in (select boss_type_id from cc_assessment_managers) \n\
			) \n\
	");


	var dm = ArraySelectDistinct(mq, 'This.id');

	// т.к. в выборку попадают и непосредственные рук-ли и те, на которых делегировали,
	// приходится делать этот маразм
	var result = [];
	for (el in dm) {
		obj = {
			id: OptInt(el.id),
			fullname: String(el.fullname),
			email: String(el.email),
			position: String(el.position),
			department: String(el.department),
			boss_type_name: String(el.boss_type_name)
		}

		if (el.assessment_plan_id != null) {
			fel = ArrayOptFirstElem(XQuery("sql: \n\
				select ccads.id \n\
				from cc_assessment_delegates ccads \n\
				where \n\
					ccads.[boss_delegate_id] = " + OptInt(el.id) + " \n\
					and ccads.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			"));

			if (fel != undefined) {
				obj.boss_type_name = 'Делегирование оценки';
			}
		}

		result.push(obj);
	}

	return result;
}

function getUser(userId, assessmentAppraiseId, stopHireDate) {
	var q = "sql: \n\
		select \n\
			d.*, \n\
			cbs.name position_level, \n\
			cbs_parent.name channel_level \n\
		from ( \n\
			select \n\
					cs.id, \n\
					cs.fullname, \n\
					cs.position_name as position, \n\
					cs.position_parent_name as department, \n\
					m.[count] \n\
			from \n\
				collaborators cs, \n\
				( \n\
					select count(*) as [count] \n\
					from func_managers fms \n\
					left join collaborators c on c.id = fms.[object_id] \n\
					left join assessment_plans aps on (aps.person_id = c.id and aps.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
					left join cc_assessment_delegates ccads on (ccads.user_id = c.id and ccads.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
					--left join pas ps on (ps.person_id = aps.person_id and ps.expert_person_id = aps.boss_id and ps.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
					--left join pa p on p.id = ps.id \n\
					left join cc_assessment_moderators ccam on ccam.user_id = " + userId + " \n\
					--left join cc_assessment_actions ccaa on ccaa.role_id = ccam.role_id \n\
					where \n\
						convert(date, c.hire_date, 105) < convert(date, '" + DateNewTime(stopHireDate) + "', 105) \n\
						and ( \n\
							( \n\
								fms.person_id = " + userId + " \n\
								and ( \n\
									ccads.prev_boss_id <> fms.person_id \n\
									or ccads.prev_boss_id is null \n\
									--p.data.query('/pa/custom_elems/custom_elem[name=''manager_delegating_duties'']/value').value('.', 'varchar(20)') <> fms.person_id \n\
									--or p.data.query('/pa/custom_elems/custom_elem[name=''manager_delegating_duties'']/value').value('.', 'varchar(20)') is null \n\
								) \n\
								and ( \n\
									fms.boss_type_id in ( \n\
										select id from boss_types where code = 'main' \n\
									) \n\
									or \n\
									fms.boss_type_id in (select boss_type_id from cc_assessment_managers) \n\
								) \n\
							) \n\
							or ccads.boss_delegate_id = " + userId + " \n\
							--or ( \n\
							--	ccaa.[action] in ('view') \n\
							--	and ccaa.object_type = 'pa' \n\
							--) \n\
							or ( \n\
								aps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
								and aps.boss_id = " + userId + " \n\
							) \n\
						) \n\
				) m \n\
			where cs.id = " + userId + " \n\
		) d \n\
		left join cc_assessment_mains ccams on ccams.[user_id] = d.id \n\
		left join competence_blocks cbs on cbs.id = ccams.competence_block_id \n\
		left join competence_blocks cbs_parent on cbs_parent.id = cbs.parent_object_id";

	//alert('getUser: ' + q);
	var col = ArrayOptFirstElem(XQuery(q));
	if (col != undefined) {
		return {
			id: String(col.id),
			fullname: String(col.fullname),
			position: String(col.position),
			department: String(col.department),
			isManager: OptInt(col.count) > 0,
			position_level: String(col.position_level),
			channel_level: String(col.channel_level)
		}
	}

	return {};
}

function getSubordinates(userId, assessmentAppraiseId, stopHireDate, search, minRow, maxRow, pageSize) {
	var Assessment = OpenCodeLib('./assessment.js');
	DropFormsCache('./assessment.js');

	function getS(minRow, maxRow) {
		var qsubs = "sql: \n\
			declare @s varchar(300) = '" + search + "'; \n\
			select d.* \n\
			from ( \n\
				select \n\
					c.*, \n\
					count(c.id) over() total, \n\
					row_number() over (order by c.fullname asc) as [row_number] \n\
				from ( \n\
					select \n\
						aps.id assessment_plan_id, \n\
						c.id, \n\
						c.fullname, \n\
						c.is_dismiss, \n\
						c.position_name as position, \n\
						c.position_parent_name as department \n\
						--ps.id pa_id \n\
						----ps.overall \n\
					from func_managers fms \n\
					left join collaborators c on c.id = fms.[object_id] \n\
					left join assessment_plans aps on (aps.person_id = c.id and aps.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
					left join cc_assessment_delegates ccads on (ccads.user_id = c.id and ccads.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
					--left join pas ps on (ps.person_id = aps.person_id and ps.expert_person_id = aps.boss_id and ps.assessment_appraise_id = " + assessmentAppraiseId + ") \n\
					--left join pa p on p.id = ps.id \n\
					left join cc_assessment_moderators ccam on ccam.user_id = " + userId + " \n\
					--left join cc_assessment_actions ccaa on ccaa.role_id = ccam.role_id \n\
					where \n\
						c.fullname like '%'+@s+'%' \n\
						and c.is_dismiss = 0 \n\
						and replace(replace(replace(replace(lower(c.position_name), char(13), ''), char(10), ''), ' ', ''), '-', '') not in ('агент(юл)','агент(ип)', 'агент(фл)', 'уборщикслужебныхпомещений','водитель','персональныйводитель','фитнестренер','комендант','курьер','дворник','помощникспециалиста') \n\
						and isnull(c.current_state, '') not in ('Декретный', 'Женщинам дети до 1,5', 'Уход 1,5', 'Уход до 3') \n\
						and convert(date, c.hire_date, 105) < convert(date, '" + DateNewTime(stopHireDate) + "', 105) \n\
						and c.id not in ( \n\
							select R.p.query('exclude_collaborator_id').value('.', 'bigint') id \n\
							from cc_assessment_settings cass \n\
							inner join cc_assessment_setting cas on cas.id = cass.id \n\
							cross apply cas.data.nodes('/cc_assessment_setting/exclude_collaborators/exclude_collaborator') as R(p) \n\
							where cass.assessment_appraise_id = " + assessmentAppraiseId + " \n\
						) \n\
						and ( \n\
							( \n\
								fms.person_id = " + userId + " \n\
								and ( \n\
									ccads.prev_boss_id <> fms.person_id \n\
									or ccads.prev_boss_id is null \n\
									--p.data.query('/pa/custom_elems/custom_elem[name=''manager_delegating_duties'']/value').value('.', 'varchar(20)') <> fms.person_id \n\
									--or p.data.query('/pa/custom_elems/custom_elem[name=''manager_delegating_duties'']/value').value('.', 'varchar(20)') is null \n\
								) \n\
								and ( \n\
									fms.boss_type_id in ( \n\
										select id from boss_types where code = 'main' \n\
									) \n\
									or \n\
									fms.boss_type_id in (select boss_type_id from cc_assessment_managers) \n\
								) \n\
							) \n\
							or ccads.boss_delegate_id = " + userId + " \n\
							--or ( \n\
							--	ccaa.[action] in ('view') \n\
							--	and ccaa.object_type = 'pa' \n\
							--) \n\
							or ( \n\
								aps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
								and aps.boss_id = " + userId + " \n\
							) \n\
						) \n\
					group by aps.id, c.id, c.fullname, c.is_dismiss, c.position_name, c.position_parent_name \n\
				) c \n\
			) d \n\
			where \n\
				d.[row_number] > " + minRow + " and d.[row_number] <= " + maxRow + " \n\
			order by d.fullname asc";

		//alert('getSubordinates: ' + qsubs);
		return XQuery(qsubs);
	}

	var sq = ArrayDirect(getS(minRow, maxRow));
	var result = [];
	var i = 0;

	while (ArrayCount(sq) > 0 && result.length != pageSize) {
		//alert('result.length: ' + result.length);
		//alert('i: ' + i);

		try {
			s = sq[i];
		} catch(e) { break; }

		blockSub = searchBlockSub(userId, assessmentAppraiseId);
		//isCont = (i % 2) == 0;
		if (blockSub != undefined/* && isCont*/) {
			o = ArrayOptFirstElem(XQuery("sql: \n\
				select ps.overall \n\
				from pas ps \n\
				where \n\
					ps.assessment_plan_id = " + s.assessment_plan_id + " \n\
					and ps.person_id = " + s.id + " \n\
					and ps.expert_person_id = " + s.id + " \n\
					and ps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			"));

			/*alert('s.assessment_plan_id: ' + s.assessment_plan_id);
			alert('s.id: ' + s.id);
			alert('o == undefined: ' + (o == undefined));*/

			data = {
				id: String(s.id),
				fullname: String(s.fullname),
				position: String(s.position),
				department: String(s.department),
				shouldHasPa: true,
				hasPa: (s.assessment_plan_id != null),
				assessment: {}
			}

			plan = Assessment.getAssessmentPlan(String(s.id), assessmentAppraiseId);
			if (plan != undefined) {
				data.assessment = {
					step: String(plan.step),
					stepName: String(plan.stepName),
					overall: (o != undefined ? String(o.overall) : '')
				}
			}
			result.push(data);
		}

		i = i + 1;
		if (i == pageSize && result.length < pageSize) {
			//alert('result: ' + tools.object_to_text(result, 'json'));

			i = 0;
			minRow = maxRow + 1;
			maxRow = minRow + pageSize;
			sq = ArrayDirect(getS(minRow, maxRow));
		}
	}

	var total = 0;
	var fobj = ArrayOptFirstElem(sq);
	if (fobj != undefined) {
		total = fobj.total;
	}

	return {
		meta: {
			total: Int(total),
			pageSize: pageSize,
			min_row: minRow,
			max_row: maxRow
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