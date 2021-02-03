function roles() {
	var robj = {};
	var qr = XQuery("sql: \n\
		select code \n\
		from cc_idp_roles \n\
	");

	for (el in qr) {
		robj.SetProperty(String(el.code), String(el.code));
	}

	//alert(tools.object_to_text(robj, 'json'));
	return robj;

	/*return {
		'user': 'user',
		'manager': 'manager',
		'hrbp': 'hrbp',
		'moderator': 'moderator'
	}*/
}

function getManagerForIdp(userId, assessmentAppraiseId) {
	var mainManager = ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			cs.id, \n\
			cs.fullname, \n\
			cs.email, \n\
			cs.position_name, \n\
			cs.position_parent_name \n\
		from collaborators cs \n\
		left join func_managers fm on fm.person_id = cs.id \n\
		left join boss_types bts on bts.id = fm.boss_type_id \n\
		where \n\
			fm.[object_id] = " + userId + " \n\
			and bts.code = 'main' \n\
	"));

	if (mainManager != undefined) {
		var dm = ArrayOptFirstElem(XQuery("sql: \n\
			select \n\
				cs.id, \n\
				cs.fullname, \n\
				cs.email, \n\
				cs.position_name, \n\
				cs.position_parent_name \n\
			from cc_assessment_delegates ccads \n\
			left join collaborators cs on cs.id = ccads.[boss_delegate_id] \n\
			where \n\
				ccads.prev_boss_id = " + OptInt(mainManager.id) + " \n\
				and ccads.[user_id] = " + userId + " \n\
				and ccads.assessment_appraise_id = " + assessmentAppraiseId + " \n\
		"));

		if (dm != undefined) {
			return dm;
		}

		return mainManager;
	}
}

function getManagers(userId, assessmentAppraiseId){
	var mq = XQuery("sql: \n\
		select \n\
			dps.id development_plan_id, \n\
			cs.id, \n\
			cs.fullname, \n\
			cs.email, \n\
			cs.position_name, \n\
			cs.position_parent_name, \n\
			'���������������� ������������' expert_person_type_name \n\
		from collaborators cs \n\
		inner join development_plans dps on dps.expert_person_id = cs.id \n\
		where \n\
			dps.person_id = " + userId + " \n\
			and dps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
		union \n\
		select \n\
			null development_plan_id, \n\
			cs.id, \n\
			cs.fullname, \n\
			cs.email, \n\
			cs.position_name, \n\
			cs.position_parent_name, \n\
			bts.name expert_person_type_name \n\
		from collaborators cs \n\
		left join func_managers fm on fm.person_id = cs.id \n\
		left join boss_types bts on bts.id = fm.boss_type_id \n\
		where \n\
			fm.[object_id] = " + userId + " \n\
			and ( \n\
				bts.code = 'main' \n\
				or bts.code in (select code from cc_idp_roles) \n\
			) \n\
	");


	var dm = ArraySelectDistinct(mq, 'This.id');

	// �.�. � ������� �������� � ���������������� ���-�� � ��, �� ������� ������������,
	// ���������� ������ ���� ������
	var result = [];
	for (el in dm) {
		obj = {
			id: OptInt(el.id),
			fullname: String(el.fullname),
			email: String(el.email),
			position_name: String(el.position_name),
			position_parent_name: String(el.position_parent_name),
			expert_person_type_name: String(el.expert_person_type_name)
		}

		if (el.development_plan_id != null) {
			fel = ArrayOptFirstElem(XQuery("sql: \n\
				select ccads.id \n\
				from cc_assessment_delegates ccads \n\
				where \n\
					ccads.[boss_delegate_id] = " + OptInt(el.id) + " \n\
					and ccads.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			"));

			if (fel != undefined) {
				obj.expert_person_type_name = '������������� ����� ��������';
			}
		}

		result.push(obj);
	}
	return result;
}

function getActions(user_id, object_type) {
	var actions = [];

	var actionsq = XQuery("sql: \n\
		select ccia.action \n\
		from cc_ex_assessment_roles ccir \n\
		inner join cc_ex_assessment_moderators ccim on ccim.role_id = ccir.id \n\
		inner join cc_ex_assessment_actions ccia on ccia.role_id = ccim.role_id \n\
		where \n\
			ccim.user_id = " + user_id + " \n\
			and ccia.object_type = '" + object_type + "'");

	for (el in actionsq) {
		actions.push(String(el.action));
	}

	return actions;
}

function isModerator(user_id) {
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select ccir.id \n\
		from cc_ex_assessment_roles ccir \n\
		inner join cc_ex_assessment_moderators ccim on ccim.role_id = ccir.id \n\
		where \n\
			ccim.user_id = " + user_id + " \n\
			and ccir.code = 'moderator'"));

	return (q != undefined); 
}

function getBoss(collaboratorId) {

	var q = XQuery("sql: \n\
		select fm.person_id \n\
		from func_managers fm \n\
		where \n\
			fm.[object_id] = " + collaboratorId + " \n\
			and fm.catalog = 'collaborator' \n\
			and fm.is_native = 1 \n\
	");

	return q == undefined ? q : q.person_id;
}



// ��������� ������������� ��� �������� �����������, �������� ������� �� ��������
function getNextManagerTypes(curOrderNum, nextOrderNum) {
	return XQuery("sql: \n\
		select \n\
			ccabts.boss_type_id \n\
		from \n\
			cc_adaptation_boss_types ccabts \n\
		inner join boss_types bts on bts.id = ccabts.boss_type_id \n\
		where \n\
			ccabts.order_number <= " + nextOrderNum + " \n\
			and ccabts.order_number <> " + curOrderNum + " \n\
	");
}

// ��������� ������������� ��� �������� �����������, �������� ������� �� ��������
function getPrevManagerTypes(nextOrderNum) {
	return XQuery("sql: \n\
		select \n\
			ccabts.boss_type_id \n\
		from \n\
			cc_adaptation_boss_types ccabts \n\
		inner join boss_types bts on bts.id = ccabts.boss_type_id \n\
		where \n\
			ccabts.order_number < " + nextOrderNum + " \n\
	");
}

function getById(id){
	return ArrayOptFirstElem(XQuery("for $el in collaborators where $el/id = " + id + " return $el"));
}

function getRole(userId, dpId, dpdoc) {
	//alert('getRole_userId: ' + userId);
	//alert('getRole_dpId: ' + dpId);

	//alert('11111111111111111');
	var rs = roles();
	//alert('22222222222222222');

	// �������� �� �����
	var dpDoc = null;
	try {
		if (dpdoc != undefined) {
			dpDoc = dpdoc;
		} else {
			dpDoc = OpenDoc(UrlFromDocID(Int(dpId)));
		}

		if (userId == dpDoc.TopElem.person_id) {
			return rs.user;
		}
	} catch(e) {}
	//

	//alert('33333333333333');
	// �������� �� ���-��
	try {
		if (dpDoc != null) {
			//alert('33333333333333_1');
			var pId = OptInt(dpDoc.TopElem.person_id);
			var epId = OptInt(dpDoc.TopElem.expert_person_id);
			var apId = OptInt(dpDoc.TopElem.assessment_appraise_id);

			var qmr = ArrayOptFirstElem(XQuery("sql: \n\
				select dps.id \n\
				from development_plans dps \n\ 
				where \n\
					dps.id = " + dpId + " \n\
					and ( \n\
						(dps.expert_person_id = " + epId + " and dps.person_id = " + pId + ") \n\
						or ( \n\
							select count(ads.id) \n\
							from cc_assessment_delegates ads \n\
							where \n\
								ads.boss_delegate_id = " + epId + " \n\
								and ads.[user_id] = " + pId + " \n\
								and ads.assessment_appraise_id = " + apId + " \n\
						) > 0 \n\
					) \n\
			"));

			if (qmr != undefined) {
				return rs.main;
			}
		}
	} catch(e) {}
	//

	//alert('44444444444444444');
	//�������� �� ����������
	var qmod = XQuery("sql: \n\
		select ims.id, irs.code \n\
		from cc_idp_moderators ims \n\
		inner join cc_idp_roles irs on irs.id = ims.idp_role_id \n\
		where \n\
			ims.collaborator_id = " + userId + " \n\
			and irs.code = '" + rs.moderator + "'"
	);

	var melem = ArrayOptFirstElem(qmod);
	if (melem != undefined) {
		return String(melem.code);
	}
	//

	//alert('55555555555555555');
	// �������� �� hrbp
	if (dpDoc != null) {
		var hrbpq = ArrayOptFirstElem(XQuery("sql: \n\
			select bts.code \n\
			from func_managers fms \n\
			inner join boss_types bts on bts.id = fms.boss_type_id \n\
			where \n\
				fms.[object_id] = " + OptInt(dpDoc.TopElem.person_id) + " \n\
				and fms.[person_id] = " + userId + " \n\
				and bts.code = '" + rs.hrbp + "' \n\
		"));

		if (hrbpq != undefined) {
			return String(hrbpq.code);
		}
	}

	//alert('6666666666666666666');
	return '';
}

function getRoleRecordByUserId(userId, crId) {
	var uroleName = getRole(userId, crId);

	return ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			ccabts.*, \n\
			bts.code user_role, \n\
			ccabts.title user_role_title \n\
		from \n\
			cc_adaptation_boss_types ccabts \n\
		inner join boss_types bts on bts.id = ccabts.boss_type_id \n\
		where \n\
			bts.code = '" + uroleName + "' \n\
	"));
}

function getActionsByRole(role, stepId) {
	var o = [];
	var strq = " \n\
		select \n\
			distinct(iafs.code), \n\
			iafs.name \n\
		from cc_idp_role_operations ars \n\
		inner join cc_idp_roles irs on irs.id = ars.current_idp_role_id \n\
		inner join cc_idp_action_flows iafs on iafs.id = ars.idp_action_flow_id \n\
		where \n\
			irs.code = '" + role + "'";
		
	if (stepId != undefined){
		strq = strq + " and ars.current_idp_step_id = " + Int(stepId)
	}

	strq = strq + " order by iafs.name"

	var q = XQuery("sql: " + strq);
	for (el in q){
		o.push({
			code: String(el.code),
			name: String(el.name)
		});
	}
	return o;
}

function getTutorRoles(tutorId, role){
	var strq = " \n\
		select \n\
			distinct(bt.code), \n\
			bt.name \n\
		from ( \n\
			select \n\
				t.p.query('boss_type_id').value('.','varchar(50)') boss_type_id, \n\
				t.p.query('person_id').value('.','varchar(50)') tutor_id \n\
			from  \n\
				career_reserves crs \n\
			inner join career_reserve cr on cr.id = crs.id \n\
			cross apply cr.data.nodes('/career_reserve/tutors/tutor') as t(p) \n\
		) c \n\
		inner join boss_types bt on bt.id = c.boss_type_id \n\
		where \n\
			c.tutor_id = " + tutorId + " \n\
	";
	if (role != undefined){
		strq = strq + " and and bt.code = '" + role + "'"
	}

	return XQuery("sql: " + strq);
}

function newObject(userId){
	var o = getById(userId);
	return o;
}

