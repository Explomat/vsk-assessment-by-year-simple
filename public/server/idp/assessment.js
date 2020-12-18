function getCommonScales() {
	return XQuery("sql: \n\
		select * \n\
		from cc_assessment_commons \n\
	");
}