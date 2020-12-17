import React, { Component } from 'react';
import { Table, Tag } from 'antd';

class AssessmentLegends extends Component {
	render() {
		const source = this.props.assessments.map((a, index) => {
			return {
				key: index,
				...a
			}
		});

		const { style } = this.props;
		return (
			<Table style={style} bordered={false} showHeader={false} className='adaptation__legend_table' pagination={false} dataSource={source} columns={[
				{
					title: '',
					dataIndex: 'name',
					key: 'name',
					render: (text, record) => <Tag color={record.color}>{text}</Tag>
				},
				{
					title: '',
					dataIndex: 'description',
					key: 'description'
				}
			]} />
		);
	}
}

export default AssessmentLegends;