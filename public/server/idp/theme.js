function list(dpId, competenceId) {
	var q = XQuery("sql: \n\
		select ics.id, its.name, ics.percent_complete \n\
		from cc_idp_themes its \n\
		inner join cc_idp_competences ics on ics.idp_theme_id = its.id \n\
		where \n\
			ics.development_plan_id = " + dpId + " \n\
			and ics.competence_id = " + competenceId + "; \n\
	");
	return q;
}