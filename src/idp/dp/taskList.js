import React, { Component } from 'react';
import { Divider, Table } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TaskForm from './taskForm';
import { renderDate } from '../../utils/date';

class TaskList extends Component {

	constructor(props){
		super(props);

		this.state = {
			isShowModalEdit: false
		}

		this.currentTask = null;

		this.handleToggleEditModal = this.handleToggleEditModal.bind(this);
		this.handleUpdate = this.handleUpdate.bind(this);
	}

	handleUpdate(state){
		const { competenceId, assessment_appraise_id, development_plan_id, updateTask } = this.props;
		updateTask(
			this.currentTask.id,
			state,
			assessment_appraise_id,
			development_plan_id,
			competenceId
		);
		this.handleToggleEditModal();
	}

	handleToggleEditModal(task) {
		this.currentTask = task;
		this.setState({
			isShowModalEdit: !this.state.isShowModalEdit
		});
	}

	render() {
		const { competenceId, tasks, removeTask, meta } = this.props;
		const { isShowModalEdit } = this.state;

		if (tasks) {
			const columns = [
				{
					title: 'Тип задачи',
					dataIndex: 'task_type_name',
					key: 'task_type_name',
					render: (task_type_name, task) => (
						<div>
							<div className='dp__date dp__task-date'>{renderDate(task.created_date)}</div>
							<div>{task_type_name}</div>
						</div>
					)
				},
				{
					title: 'Поля для выбора / заполнения',
					dataIndex: 'description',
					key: 'description'
				},
				{
					title: 'Образ результата',
					dataIndex: 'resut_form',
					key: 'resut_form'
				},
				{
					title: 'Эксперт',
					dataIndex: 'expert_collaborator_fullname',
					key: 'expert_collaborator_fullname'
				},
				{
					title: 'Процент выполнения',
					dataIndex: 'percent_complete',
					key: 'percent_complete'
				},
				{
					dataIndex: 'update',
					key: 'update',
					render: (text, task) => (
						<span>
							{meta.allow_edit_tasks && <EditOutlined className='task__icon' onClick={() => this.handleToggleEditModal(task)}/>}
							{meta.allow_edit_tasks && meta.allow_remove_tasks && <Divider type='vertical' />}
							{meta.allow_remove_tasks && <DeleteOutlined className='task__icon' onClick={() => removeTask(task.id, competenceId)}/>}
						</span>
					)
				}
			];
			return (
				<div>
					<Table dataSource={tasks} columns={columns} rowKey='id' pagination={false}/>
					{isShowModalEdit && <TaskForm
						title='Редактирование'
						onCommit={this.handleUpdate}
						onCancel={this.handleToggleEditModal}
						{...this.currentTask}
						{...this.props}
					/>}
				</div>
			);	
		}
	}
}

export default TaskList;