import React, { Component } from 'react';
import { Card, Table } from 'antd';
import { renderDate } from '../../utils/date';

class ThemeList extends Component {

	render() {
		const { competences } = this.props;

		const themeColumns = [
			{
				title: 'Название темы',
				dataIndex: 'name',
				key: 'name'
			},
			{
				title: 'Процент выполнения',
				dataIndex: 'percent_complete',
				key: 'percent_complete'
			},
			{
				dataIndex: 'update',
				key: 'update'
			}
		];

		return (
			<div>
				{competences.map(c =>
					<Card
						key={c.id}
						title={c.name}
						className='dp__competence-and-themes'
					>
						<Table dataSource={c.themes} columns={themeColumns} rowKey='id' pagination={false}/>
					</Card>
				)}
			</div>
		);
	}
}

export default ThemeList;