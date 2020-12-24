function getCommonScales() {
	return XQuery("sql: \n\
		select * \n\
		from cc_assessment_commons \n\
	");
}

function getAssessmentPlanByUserId(userId, assessmentAppraiseId) {
	return ArrayOptFirstElem(
		XQuery("sql: \n\
			select \n\
				aps.id, \n\
				aps.workflow_id, \n\
				aps.workflow_state, \n\
				ap.data.query('/assessment_plan/workflow_state_name').value('.', 'nvarchar(50)') workflow_state_name \n\
			from assessment_plans aps \n\
			inner join assessment_plan ap on ap.id = aps.id \n\
			where \n\ 
				aps.person_id = " + userId + " \n\
				and aps.assessment_appraise_id = " + assessmentAppraiseId + " \n\
		")
	);
}