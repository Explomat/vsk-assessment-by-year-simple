import React, { Component } from 'react';
import { Modal, Input, Select, Button } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import CollaboratorList from '../../components/list';

class TaskForm extends Component {

	constructor(props){
		super(props);

		const defaultTaskType = props.task_types[0];
		this.state = {
			isShowCollaborators: false,
			idp_task_type_id: props.idp_task_type_id || (defaultTaskType && defaultTaskType.id),
			description: props.description || '',
			resut_form: props.resut_form || '',
			expert_collaborator_id: props.expert_collaborator_id || null,
			expert_collaborator_fullname: props.expert_collaborator_fullname || ''
		}

		this.handleShowCollaborators = this.handleShowCollaborators.bind(this);
		this.handleChangeProp = this.handleChangeProp.bind(this);
		this.handleCommit = this.handleCommit.bind(this);
		this.handleSelectExpert = this.handleSelectExpert.bind(this);
	}

	handleShowCollaborators() {
		this.setState({
			isShowCollaborators: !this.state.isShowCollaborators
		});
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

	handleSelectExpert(items) {
		const item = items[0];

		if (item) {
			this.handleChangeProp('expert_collaborator_id', item.id);
			this.handleChangeProp('expert_collaborator_fullname', item.name);
			this.handleShowCollaborators();
		}
	}

	render() {
		const { task_types, onCancel } = this.props;
		const {
			isShowCollaborators,
			idp_task_type_id,
			description,
			resut_form,
			expert_collaborator_fullname
		} = this.state;

		return (
			<Modal
				className='dp-meta-task'
				title='Задача'
				visible
				onOk={this.handleCommit}
				onCancel={onCancel}
				footer={[
					<Button disabled={description.trim() === '' || resut_form.trim() === ''} type='primary' key='submit' onClick={this.handleCommit}>
						Сохранить
					</Button>,
					<Button key='cancel' onClick={onCancel}>
						Отмена
					</Button>
				]}
			>
				<div className='dp-meta-task__form-label-container'>
					<label className='dp-meta-task__form-label'>Тип задачи</label>
					<Select
						defaultValue={idp_task_type_id}
						onChange={value => this.handleChangeProp('idp_task_type_id', value)}
					>
						{task_types.map(tp => {
							return (
								<Select.Option key={tp.id} value={tp.id}>{tp.name}</Select.Option>
							);
						})}
					</Select>
				</div>
				<div className='dp-meta-task__form-label-container'>
					<label className='dp-meta-task__form-label'>Описание</label>
					<Input.TextArea
						placeholder='Опишите задачу'
						value={description}
						autosize={{ minRows: 2, maxRows: 3}}
						onChange={e => this.handleChangeProp('description', e.target.value)}
					/>
				</div>
				<div className='dp-meta-task__form-label-container'>
					<label className='dp-meta-task__form-label'>Образ результата</label>
					<Input.TextArea
						placeholder='Опишите результат'
						value={resut_form}
						autosize={{ minRows: 3, maxRows: 6}}
						onChange={e => this.handleChangeProp('resut_form', e.target.value)}
					/>
				</div>
				<div className='dp-meta-task__form-label-container'>
					<label className='dp-meta-task__form-label'>Эксперт</label>
					<Input
						placeholder='Выберите эксперта'
						value={expert_collaborator_fullname}
						addonAfter={<EllipsisOutlined onClick={this.handleShowCollaborators}/>}
					/>
				</div>
				{isShowCollaborators &&
					<CollaboratorList
						title='Сотрудники'
						type='Collaborators'
						onOk={this.handleSelectExpert}
						onCancel={this.handleShowCollaborators}
						commonParams={{ project: 'idp', multiple: false }}
					/>
				}
			</Modal>
		);
	}
}

export default TaskForm;