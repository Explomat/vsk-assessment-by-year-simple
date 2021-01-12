import React, { Component } from 'react';
import { Divider, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import TaskForm from './taskForm';
import { renderDate } from '../../utils/date';

class Task extends Component {

	constructor(props){
		super(props);

		this.state = {
			isShowModal: false
		}

		this.handleToggleModal = this.handleToggleModal.bind(this);
		this.handleUpdate = this.handleUpdate.bind(this);
	}

	handleUpdate(state){
		const { id, updateTask } = this.props;
		updateTask(id, {
			id,
			...state
		});
		this.handleToggleModal();
	}

	handleToggleModal(){
		this.setState({
			isShowModal: !this.state.isShowModal
		});
	}


	render() {
		const { meta, id, created_date, removeTask } = this.props;
		const {
			task_type_name,
			description,
			resut_form,
			expert_collaborator_fullname,
			percent_complete
		} = this.props;
		const { isShowModal } = this.state;
		return (
			<tr className='ant-table-row ant-table-row-level-0'>
				<td>
					<div className='dp__date dp__task-date'>{renderDate(created_date)}</div>
					<div>{task_type_name}</div>
				</td>
				<td>
					{description}
				</td>
				<td>
					{resut_form}
				</td>
				<td>
					{expert_collaborator_fullname}
				</td>
				<td>
					{percent_complete}
				</td>
				<td>
					<span>
						{meta.allow_edit_tasks && <EditOutlined className='task__icon' onClick={this.handleToggleModal}/>}
						{meta.allow_edit_tasks && meta.allow_remove_tasks && <Divider type='vertical' />}
						{meta.allow_remove_tasks && <DeleteOutlined className='task__icon' onClick={() => removeTask(id)}/>}
					</span>
				</td>
				{isShowModal && <TaskForm
					title='Редактирование'
					onOk={this.handleUpdate}
					onCancel={this.handleToggleModal}
					{...this.props}
				/>}
			</tr>
		);
	}
}

export default Task;