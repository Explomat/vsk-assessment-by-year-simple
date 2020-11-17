function getCollaborators(userId, search, excudeSubordinates) {
	var colls = XQuery("sql: \n\
		select \n\
			TOP 5 \n\
			col.id, \n\
			col.fullname as title, \n\
			col.position_name as position, \n\
			col.position_parent_name as department, \n\
			(col.position_parent_name + ' -> ' + col.position_name) as description \n\
		from \n\
			collaborators as col \n\
		where \n\
			col.is_dismiss = 0 \n\
			and col.id <> " + userId + " \n\
			and col.fullname like ('%" + search + "%') \n\
			" + (excudeSubordinates.length > 0 ? "and col.id not in (" + excudeSubordinates + ")" : "") + " \n\
	");

	return colls;
}