function _setComputedFields(obj, userId) {
	var l = ArrayOptFirstElem(XQuery("sql: \n\
		select id \n\
		from cc_news_feeds_likes \n\
		where \n\
			object_type = 'cc_news_feeds_comment' \n\
			and object_id = " + obj.id + " \n\
			and user_id = " + userId + " \n\
	"));
	
	var actions = _getModeratorActions(userId);
	var authorDoc = OpenDoc(UrlFromDocID(Int(obj.author_id)));

	obj.publish_date = StrXmlDate(Date(obj.publish_date));
	obj.pict_url = String(authorDoc.TopElem.pict_url);
	obj.is_archive = _toBoolean(obj.is_archive);

	obj.meta = {
		isLiked: (l != undefined || obj.is_archive),
		canLike: !obj.is_archive,
		canResponse: !obj.is_archive,
		canEdit: (
			(Int(obj.author_id) == Int(userId) || (ArrayOptFind(actions, "This == 'update'") != undefined)) && !obj.is_archive
		),
		canDelete: (
			(Int(obj.author_id) == Int(userId) || (ArrayOptFind(actions, "This == 'remove'") != undefined)) && !obj.is_archive
		)
	}

	return obj;
}

function getByTaskId(taskId){
	return ArrayOptFirstElem(XQuery('for $el in cc_idp_tasks where $el/id = \'' + taskId + '\' return $el'));
}

function create(description, resut_form, expert_collaborator_id, idp_task_type_id, development_plan_id, competence_id) {
	var Utils = OpenCodeLib('./utils.js');

	var taskDoc = tools.new_doc_by_name('cc_idp_task');
	taskDoc.TopElem.description = description;
	taskDoc.TopElem.resut_form = resut_form;
	taskDoc.TopElem.expert_collaborator_id = expert_collaborator_id;
	taskDoc.TopElem.idp_task_type_id = idp_task_type_id;

	var qt = ArrayOptFirstElem(XQuery("sql \n\
		select id \n\
		from cc_idp_task_states \n\
		order by order_number asc \n\
	"));

	if (qt != undefined) {
		taskDoc.TopElem.idp_task_state_id = qt.id;
	}

	taskDoc.TopElem.percent_complete = 0;
	taskDoc.TopElem.development_plan_id = development_plan_id;
	taskDoc.TopElem.competence_id = competence_id;

	taskDoc.BindToDb(DefaultDb);
	taskDoc.Save();

	return _setComputedFields(Utils.toJSObject(taskDoc.TopElem), userId);
}

function update(dpId, taskId, data, userId){
	var Utils = OpenCodeLib('./utils.js');

	var task = getByTaskId(taskId);
	if (task == undefined){
		return null;
	}

	var taskDoc = OpenDoc(UrlFromDocID(Int(task.id)));
	for (el in data){
		try {
			ch = taskDoc.TopElem.OptChild(el);
			ch.Value = data[el];
		} catch(e) {}
	}
	taskDoc.Save();

	return _setComputedFields(Utils.toJSObject(taskDoc.TopElem), userId);
}

function remove(taskId){
	var task = getByTaskId(taskId);
	if (task != undefined){
		DeleteDoc(UrlFromDocID(Int(task.id)));
		return true;
	}

	return false;
}

function list(dpId, competenceId, userId) {
	var Utils = OpenCodeLib('./utils.js');

	var qt = XQuery("sql: \n\
		select \n\
			its.id, \n\
			its.description, \n\
			its.resut_form, \n\
			its.percent_complete, \n\
			its.expert_collaborator_id, \n\
			cs.fullname expert_collaborator_fullname, \n\
			itts.id task_type_id, \n\
			itts.code task_type_code, \n\
			itts.name task_type_name, \n\
			itts.min_count task_type_min_count, \n\
			itts.max_count task_type_max_count, \n\
			itss.id task_state_id, \n\
			itss.code task_state_code, \n\
			itss.name task_state_name, \n\
			it.data.query('/cc_idp_task/doc_info/creation/date').value('.', 'datetime2') created_date \n\
		from cc_idp_tasks its \n\
		inner join cc_idp_task it on it.id = its.id \n\
		inner join cc_idp_task_types itts on itts.id = its.idp_task_type_id \n\
		inner join cc_idp_task_states itss on itss.id = its.idp_task_state_id \n\
		left join collaborators cs on cs.id = its.expert_collaborator_id \n\
		where \n\
			its.development_plan_id = " + dpId + " \n\
			and its.competence_id = " + competenceId + " \n\
	");

	var tarr = Utils.toJSArray(qt);
	/*for (el in tarr) {
		_setComputedFields(el, userId);
	}*/

	return tarr;
}

function getTaskTypes() {
	return XQuery("sql: \n\
		select itts.* \n\
		from cc_idp_task_types itts \n\
	");
}

function isAccessToUpdate(id, userId) {
	var User = OpenCodeLib('./user.js');
	DropFormsCache('./user.js');

	var actions = User.getActions(userId, 'cc_idp_task');
	var updateAction = ArrayOptFind(actions, 'This == \'update\'');
	return updateAction != undefined;
}

function isAccessToRemove(id, userId) {
	var User = OpenCodeLib('./user.js');
	DropFormsCache('./user.js');

	var actions = User.getActions(userId, 'cc_idp_task');
	var removeAction = ArrayOptFind(actions, 'This == \'remove\'');
	return removeAction != undefined;
}

function isAccessToAdd(userId) {
	var User = OpenCodeLib('./user.js');
	DropFormsCache('./user.js');

	var actions = User.getActions(userId, 'cc_idp_task');
	var addAction = ArrayOptFind(actions, 'This == \'add\'');
	return addAction != undefined;
}