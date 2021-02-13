function create(userID, _rules, assessmentAppraiseId) {

	function pasForUserReport(userId, status){

		var qs = "select pas.id, pas.person_fullname \n\
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
			doc = OpenDoc(UrlFromDocID(Int(p.id)));
			d = {
				person_name: String(p.person_fullname),
				status: String(doc.TopElem.status),
				overall: String(doc.TopElem.overall),
				comment: String(doc.TopElem.comment),
				competences: []
			};

			for (c in doc.TopElem.competences){
				comp = c.competence_id.OptForeignElem;
				cc = {
					competence_name: String(comp.name),
					mark_text: String(c.mark_text),
					mark_value: String(c.mark_value),
					indicators: []
				}

				for (i in c.indicators){
					ind = i.indicator_id.OptForeignElem;
					cc.indicators.push({
						indicator_name: String(ind.name),
						mark_text: String(i.mark_text),
						mark_value: String(i.mark_value),
						comment: String(i.comment)
					});
				}
				d.competences.push(cc);
			}
			result.push(d);
		}
		return result;
	}

	function columnNameByIndex (d){
		var colName = '';
		while (d > 0) {
			m = (d - 1) % 26;
			colName = String.fromCharCode(65 + m) + colName;
			d = Int((d - m) / 26)
		}
		return colName;
	}

	function colorByMark(mark, __rules){
		var c = ArrayOptFind(__rules, "String(This.scale) == '" + String(mark) + "'");
		return c == undefined ? c : c.color;
	}

	function markByPercent(percent, __rules){
		var c = ArrayOptFind(__rules, "String(This.percent) == '" + String(percent) + "'");
		return c == undefined ? c : c.scale;
	}

	function setMaxColWith(value, widths, index){
		var count = StrCharCount(value);
		widths[index] = count > widths[index] ? count : widths[index];
	}

	var path = UrlToFilePath(ObtainTempFile('.xlsx'));
	var oExcelDoc = new ActiveXObject('Websoft.Office.Excel.Document');
	oExcelDoc.CreateWorkBook();
	var oWorksheet = oExcelDoc.GetWorksheet(0);

	var _paSelf = ArrayOptFirstElem(pasForUserReport(userID, 'self'));
	var _paManager = ArrayOptFirstElem(pasForUserReport(userID, 'manager'));
	var colWidths = [];
	var	rindex = 1;

	oCell = oWorksheet.Cells.GetCell('A' + rindex);
	oCell.Value = _paSelf.person_name;
	oCell.Style.FontSize = 14;
	oCell.Style.FontColor = "#444444"; 
	oCell.Style.IsBold = true;
	rindex = rindex + 2;


	oCell = oWorksheet.Cells.GetCell('A'  + rindex);
	oCell.Value = 'Компетенции';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.ForegroundColor = '#CCCCCC';
	oCell.Style.IsBold = true;
	oCell.Style.VerticalAlignment = 'Center';
	colWidths[0] = StrCharCount(oCell.Value) * (12.0 / 9);

	oCell = oWorksheet.Cells.GetCell('B' + rindex);
	oCell.Value = 'Оценка сотрудника';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.ForegroundColor = '#CCCCCC';
	oCell.Style.IsBold = true;
	oCell.Style.VerticalAlignment = 'Center';
	colWidths[1] = StrCharCount(oCell.Value) * (12.0 / 9);

	oCell = oWorksheet.Cells.GetCell('C' + rindex);
	oCell.Value = 'Оценка руководителя';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.ForegroundColor = '#CCCCCC';
	oCell.Style.IsBold = true;
	oCell.Style.VerticalAlignment = 'Center';
	colWidths[2] = StrCharCount(oCell.Value) * (12.0 / 9);

	oCell = oWorksheet.Cells.GetCell('D' + rindex);
	oCell.Value = 'Название индикатора';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.ForegroundColor = '#CCCCCC';
	oCell.Style.IsBold = true;
	oCell.Style.VerticalAlignment = 'Center';
	colWidths[3] = StrCharCount(oCell.Value) * (12.0 / 9);

	oCell = oWorksheet.Cells.GetCell('E' + rindex);
	oCell.Value = 'Подтверждающий пример';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.ForegroundColor = '#CCCCCC';
	oCell.Style.IsBold = true;
	oCell.Style.VerticalAlignment = 'Center';
	colWidths[4] = StrCharCount(oCell.Value) * (12.0 / 9);

	oCell = oWorksheet.Cells.GetCell('F' + rindex);
	oCell.Value = 'Оценка сотрудника';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.ForegroundColor = '#CCCCCC';
	oCell.Style.IsBold = true;
	oCell.Style.VerticalAlignment = 'Center';
	colWidths[5] = StrCharCount(oCell.Value) * (12.0 / 9);

	oCell = oWorksheet.Cells.GetCell('G' + rindex);
	oCell.Value = 'Оценка руководителя';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.ForegroundColor = '#CCCCCC';
	oCell.Style.IsBold = true;
	oCell.Style.VerticalAlignment = 'Center';
	colWidths[6] = StrCharCount(oCell.Value) * (12.0 / 9);
	colWidths[7] = StrCharCount(oCell.Value) * (12.0 / 9);

	rindex = rindex + 1;

	for (i = 0; i < ArrayCount(_paSelf.competences); i = i + 1) {
		cindex = 1;
		cSelf = _paSelf.competences[i];
		cManager = _paManager != undefined ? _paManager.competences[i] : undefined;

		oCell = oWorksheet.Cells.GetCell(columnNameByIndex(cindex) + rindex);
		oCell.Value = cSelf.competence_name;
		setMaxColWith(oCell.Value, colWidths, cindex);
		cindex = cindex + 1;

		oCell = oWorksheet.Cells.GetCell(columnNameByIndex(cindex) + rindex);
		oCell.Value = cSelf.mark_text;
		oCell.Style.ForegroundColor = colorByMark(cSelf.mark_text, _rules);
		setMaxColWith(oCell.Value, colWidths, cindex);
		cindex = cindex + 1;

		if (cManager != undefined){
			oCell = oWorksheet.Cells.GetCell(columnNameByIndex(cindex) + rindex);
			oCell.Value = cManager.mark_text;
			oCell.Style.ForegroundColor = colorByMark(cManager.mark_text, _rules);
			setMaxColWith(oCell.Value, colWidths, cindex);
		}
		cindex = cindex + 1;
		

		rindex = rindex + 1;

		for (j = 0; j < ArrayCount(cSelf.indicators); j = j + 1) {
			prevCindex = cindex;
			iSelf = cSelf.indicators[j];
			iManager = cManager != undefined ? cManager.indicators[j] : undefined;

			oCell = oWorksheet.Cells.GetCell(columnNameByIndex(cindex) + rindex);
			oCell.Value = iSelf.indicator_name;
			setMaxColWith(oCell.Value, colWidths, cindex);
			cindex = cindex + 1;

			oCell = oWorksheet.Cells.GetCell(columnNameByIndex(cindex) + rindex);
			oCell.Value = iSelf.comment;
			setMaxColWith(oCell.Value, colWidths, cindex);
			cindex = cindex + 1;

			oCell = oWorksheet.Cells.GetCell(columnNameByIndex(cindex) + rindex);
			oCell.Value = iSelf.mark_text;
			oCell.Style.ForegroundColor = colorByMark(iSelf.mark_text, _rules);
			setMaxColWith(oCell.Value, colWidths, cindex);
			cindex = cindex + 1;

			if (iManager != undefined){
				oCell = oWorksheet.Cells.GetCell(columnNameByIndex(cindex) + rindex);
				oCell.Value = iManager.mark_text;
				oCell.Style.ForegroundColor = colorByMark(iManager.mark_text, _rules);
				setMaxColWith(oCell.Value, colWidths, cindex);
				
			}
			cindex = cindex + 1;
			
			rindex = rindex + 1;
			cindex = prevCindex;
		}
		rindex = rindex + 1;
	}

	oCell = oWorksheet.Cells.GetCell('A' + rindex);
	oCell.Value = 'Итоговая оценка сотрудника';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.IsBold = true;

	oCell = oWorksheet.Cells.GetCell('B' + rindex);
	oCell.Value = markByPercent(_paSelf.overall, _rules);
	oCell.Style.ForegroundColor = colorByMark(oCell.Value, _rules);
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.IsBold = true;
	rindex = rindex + 2;

	oCell = oWorksheet.Cells.GetCell('A' + rindex);
	oCell.Value = 'Итоговая оценка руководителя';
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.IsBold = true;

	if (_paManager != undefined) {
		oCell = oWorksheet.Cells.GetCell('B' + rindex);
		oCell.Value = markByPercent(_paManager.overall, _rules);
		oCell.Style.ForegroundColor = colorByMark(oCell.Value, _rules);
		oCell.Style.FontSize = 12;
		oCell.Style.FontColor = "#444444";
		oCell.Style.IsBold = true;
	}
	rindex = rindex + 2;

	oCell = oWorksheet.Cells.GetCell('A' + rindex);
	oCell.Value = _paSelf.comment;
	oCell.Style.FontSize = 12;
	oCell.Style.FontColor = "#444444";
	oCell.Style.IsBold = true;
	

	//alert(tools.object_to_text(colWidths, 'json'));

	for (i = 0; i < colWidths.length - 1; i = i + 1){
		oWorksheet.Cells.SetColumnWidth(i, colWidths[i + 1]);
	}

	oWorksheet.Cells.SetRowHeight(2, 30.0);

	oExcelDoc.SaveAs(path);
	return path;
}