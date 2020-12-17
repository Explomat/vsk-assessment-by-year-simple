export function calculatePercent(scales = [], rules = []) {
	const _percents = scales
		.filter(s => s !== '')
		.map(s =>{
			for (var i = rules.length - 1; i >= 0; i--) {
				if (s === ''){
					return 0;
				}
				if (rules[i].name === s){
					return rules[i].percent;
				}
			}
			return 0;
		});

	const total = _percents.reduce((f, s) => {
		return parseInt(f, 10) + parseInt(s, 10);
	}, 0);

	const average = Math.round((total / _percents.length) * 100) / 100;
	return computeScaleByPercent(average, rules);
}

function computeScaleByPercent(percent = null, rules = []) {
	const r = Math.round(parseInt(percent, 10) / 10) * 10;

	const s = rules.findIndex(rule => {
		return rule.percent == r.toString()
	});
	if (s !== -1) return rules[s];
	return null;
}