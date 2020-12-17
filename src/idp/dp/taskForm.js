import React, { Component } from 'react';
import { Modal, Input, Select, Button } from 'antd';
import AssessmentsLegend from './assessmentLegends';

class TaskForm extends Component {

	constructor(props){
		super(props);

		this.state = {
			name: props.name || '',
			expected_result: props.expected_result || '',
			achieved_result: props.achieved_result || '',
			collaborator_assessment: props.collaborator_assessment,
			manager_assessment: props.manager_assessment
		}

		this.handleChangeProp = this.handleChangeProp.bind(this);
		this.handleCommit = this.handleCommit.bind(this);
	}

	handleCommit(){
		const { onCommit } = this.props;
		onCommit(this.state);
	}


	handleChangeProp(propName, value) {
		this.setState({
			[propName]: value || ''
		});
	}

	render() {
		const { title, meta, onCancel } = this.props;
		const {
			name,
			expected_result,
			achieved_result,
			collaborator_assessment,
			manager_assessment
		} = this.state;

		let defaultCollaboratorAssessment = meta.assessments.find(a => a.name === collaborator_assessment);
		defaultCollaboratorAssessment = defaultCollaboratorAssessment === undefined ? undefined : defaultCollaboratorAssessment.name;
		/*if (!defaultCollaboratorAssessment){
			defaultCollaboratorAssessment = meta.assessments[0];
		}*/
		let defaultManagerAssessment = meta.assessments.find(a => a.name === manager_assessment);
		defaultManagerAssessment = defaultManagerAssessment === undefined ? undefined : defaultManagerAssessment.name;
		/*if (!defaultManagerAssessment){
			defaultManagerAssessment = meta.assessments[0];
		}*/
		return (
			<Modal
				title={title}
				visible={true}
				onOk={this.handleCommit}
				onCancel={onCancel}
				footer={[
					<Button disabled={name.trim() === '' || expected_result.trim() === ''} type='primary' key='submit' onClick={this.handleCommit}>
						Сохранить
					</Button>,
					<Button key='cancel' onClick={onCancel}>
						Отмена
					</Button>
				]}
			>
				<label className='adaptation__form-label'>Цель</label>
				<Input.TextArea
					disabled = {!meta.allow_edit_target}
					placeholder='Укажите вашу цель'
					value={name}
					autosize={{ minRows: 2, maxRows: 3}}
					onChange={e => this.handleChangeProp('name', e.target.value)}
				/>
				<div style={{ margin: '24px 0' }} />
				<label className='adaptation__form-label'>Ожидаемый результат</label>
				<Input.TextArea
					disabled={!meta.allow_edit_expected_result}
					placeholder='Опишите ожидаемый результат'
					value={expected_result}
					autosize={{ minRows: 3, maxRows: 6}}
					onChange={e => this.handleChangeProp('expected_result', e.target.value)}
				/>
				<div style={{ margin: '24px 0' }} />
				<div>
					<label className='adaptation__form-label'>Достигнутый результат</label>
					<Input.TextArea
						disabled={!meta.allow_edit_achieved_result}
						placeholder='Опишите достигнутый результат'
						value={achieved_result}
						autosize={{ minRows: 3, maxRows: 6}}
						onChange={e => this.handleChangeProp('achieved_result', e.target.value)}
					/>
				</div>
				<div style={{ margin: '24px 0' }} />
				{meta.allow_edit_collaborator_assessment && (<div>
					<label className='adaptation__form-label'>Оценка сотрудника</label>
					<Select
						allowClear
						defaultValue={defaultCollaboratorAssessment}
						onChange={value => this.handleChangeProp('collaborator_assessment', value)}
					>
						{meta.assessments && meta.assessments.map(a => {
							return (
								<Select.Option key={a.id} value={a.name}>{a.name}</Select.Option>
							);
						})}
					</Select>
				</div>)}
				
				<div style={{ margin: '24px 0' }} />
				{meta.allow_edit_manager_assessment && (<div>
					<label className='adaptation__form-label'>Оценка руководителя</label>
					<Select
						allowClear
						defaultValue={defaultManagerAssessment}
						onChange={value => this.handleChangeProp('manager_assessment', value)}
					>
						{meta.assessments && meta.assessments.map(a => {
							return (
								<Select.Option key={a.id} value={a.name}>{a.name}</Select.Option>
							);
						})}
					</Select>
				</div>)}
				{meta.is_show_assessments && <AssessmentsLegend style={{ marginTop: '20px' }} assessments={meta.assessments}/>}
			</Modal>
		);
	}
}

export default TaskForm;