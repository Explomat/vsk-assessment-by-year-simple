import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Card, Checkbox, Modal, Button, List, Avatar, Table } from 'antd';
import TaskForm from './TaskForm';
import { ContactsOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { getMeta, onCompetenceChecked, onThemeChecked, onSaveTask, onDeleteTask, saveIdp } from './metaActions';
import './meta.css';

class Meta extends Component {

	constructor(props){
		super(props);

		this.handleSave = this.handleSave.bind(this);
		this.handleSaveTask = this.handleSaveTask.bind(this);
		this.handleToggleTaskModal = this.handleToggleTaskModal.bind(this);
		this.handleShowConfirm = this.handleShowConfirm.bind(this);
		this.handleCreateDp = this.handleCreateDp.bind(this);
		this.handleChecked = this.handleChecked.bind(this);
		this.handlePrevStep = this.handlePrevStep.bind(this);
		this.handleNextStep = this.handleNextStep.bind(this);
		this.handleCheckedTheme = this.handleCheckedTheme.bind(this);
		this.renderConfirm = this.renderConfirm.bind(this);
		this.renderTasks = this.renderTasks.bind(this);
		this.renderButtons = this.renderButtons.bind(this);
		this.renderTaskModal = this.renderTaskModal.bind(this);

		this.state = {
			isShowConfirm: false,
			isShowTaskForm: false,
			stepsCount: 4,
			currentStep: 1
		}

		this.currentCompetenceId = null;
	}

	componentDidMount(){
		const { match, getMeta } = this.props;
		getMeta(match.params.id);
	}

	handleSave() {
		const { match, saveIdp } = this.props;
		this.props.saveIdp(match.params.id);
	}

	handleSaveTask(props) {
		this.props.onSaveTask(props, this.currentCompetenceId);
		this.handleToggleTaskModal();
	}

	handleToggleTaskModal(competenceId) {
		this.currentCompetenceId = competenceId;
		this.setState({
			isShowTaskForm: !this.state.isShowTaskForm
		});
	}

	handleChecked(e, id) {
		this.props.onCompetenceChecked(e.target.checked, id);
	}

	handleShowConfirm() {
		this.setState({
			isShowConfirm: !this.state.isShowConfirm
		});
	}

	handleCreateDp() {
		const { match, loadData } = this.props;
		loadData(match.params.id);

		this.handleShowConfirm();
	}

	handlePrevStep() {
		this.setState({
			currentStep: (this.state.currentStep - 1)
		});
	}

	handleNextStep() {
		this.setState({
			currentStep: (this.state.currentStep + 1)
		});
	}

	handleCheckedTheme(e, competenceId, themeId) {
		this.props.onThemeChecked(e.target.checked, competenceId, themeId);
	}

	renderConfirm() {
		const { meta } = this.props;

		return (
			<Modal
				visible={this.state.isShowConfirm}
				title='Подтвердите действие'
				cancelText='Отмена'
				okText='Ok'
				onCancel={this.handleShowConfirm}
				onOk={this.handleCreateDp}
			>
				<span className='content'>
					<p>{`Вы действительно хотите выбрать "${meta.selectedNode && meta.selectedNode.name}" ?`}</p>
					<p>Будьте внимательны, эти данные нельзя будет изменить.</p>
				</span>
			</Modal>
		);
	}

	renderTasks(competenceId, tasks = []) {
		const { meta, onDeleteTask } = this.props;

		const columns = [
			{
				title: 'Тип задачи',
				dataIndex: 'idp_task_type_id',
				key: 'idp_task_type_id',
				render: id => meta.task_types.find(tp => tp.id === id).name
			},
			{
				title: 'Описание',
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
				dataIndex: 'expert_collaborator_id',
				key: 'expert_collaborator_id',
				render: id => {
					const item = tasks.find(t => t.expert_collaborator_id === id);
					if (item) {
						return item.expert_collaborator_fullname;
					}
					return '';
				}
			},
			{
				title: '',
				key: 'action',
				render: task => {
					return <DeleteOutlined onClick={() => onDeleteTask(competenceId, task.id)}/>
				}
			}
		];

		return <Table dataSource={tasks} columns={columns} rowKey='id' pagination={false}/>;
	}

	renderButtons() {
		const { currentStep, stepsCount } = this.state;
		const { meta } = this.props;
		const buttons = [];

		const buttonNext = <Button key='1' className='clearfix' type='primary' style={{float: 'right'}} onClick={this.handleNextStep}>Далее</Button>;
		const buttonPrev = <Button key='2' className='clearfix' style={{float: 'left'}} onClick={this.handlePrevStep}>Назад</Button>;
		const buttonSave = <Button onClick={this.handleSave} key='3' className='clearfix' type='primary' style={{float: 'right'}} onClick={this.handleSave}>Сохранить</Button>;

		if (currentStep < stepsCount && currentStep !== 1) {
			buttons.push(buttonPrev);
		}

		if (currentStep === 1 && meta.hasChecked) {
			buttons.push(buttonNext);
		} else if (currentStep === 2 && meta.hasThemesChecked) {
			buttons.push(buttonNext);
		} else if (currentStep === (stepsCount - 1)) {
			buttons.push(buttonSave);
		}

		return <div className='dp-meta__buttons clearfix'>{buttons}</div>;
	}

	renderTaskModal() {
		const { isShowTaskForm } = this.state;
		const { meta } = this.props;
		const comp = meta.competences.find(c => c.id === this.currentCompetenceId);

		if (isShowTaskForm) {
			return (
				<TaskForm
					type='Collaborators'
					onCommit={this.handleSaveTask}
					onCancel={this.handleToggleTaskModal}
					task_types={meta.task_types}
				/>
			);
		}
	}

	render() {
		const { isShowConfirm } = this.state;
		const { meta, match } = this.props;
		const { currentStep, stepsCount } = this.state;

		if (meta.ui.isLoading) {
			return null;
		}

		return (<div>
			{currentStep === 1 &&
				<Card className='dp-meta' title='Компетенции'>
					<div className='dp-meta__description'>Выберите 1 или 2 компетенции для развития. При выборе двух компетенций - вам нужно будет выбрать по одному обязательному обучению для каждой, при выборе одно - два обучения для развития этой компетенции.</div>
					<List
						className='dp-list'
						itemLayout='horizontal'
					>
						{meta.competences.map(item => {
							const scale = meta.scales.find(s => s.scale === item.mark_text);
							const className = scale ? 'dp-meta__label--active': '';

							return (
								<List.Item key={item.id} className={`dp-meta-competence dp-meta-competence--1-step`}>
									<List.Item.Meta
										avatar={<Checkbox checked={item.checked} onChange={e => this.handleChecked(e, item.id)}/>}
										title={
											<div>
									 			<span style={{
													backgroundColor: scale && scale.color,
													borderColor: scale && scale.color
												}}
												className={`dp-meta__label ${className}`}>
													{item.mark_text}
												</span>
												<span style={{color: '#1890ff'}}>{item.name}</span>
									 		</div>
								 		}
										description={item.common_comment}
									/>
								</List.Item>
							)
						})}
					</List>
				</Card>
			}
			{currentStep === 2 &&
				<Card className='dp-meta' title='Темы обучений для развития компетенций'>
					<div className='dp-meta__description'>Выберите темы для развития</div>
					<List
						className='dp-list'
						itemLayout='horizontal'
					>
						{meta.competences.filter(c => c.checked).map(item => {
							const scale = meta.scales.find(s => s.scale === item.mark_text);
							const className = scale ? 'dp-meta__label--active': '';

							return (
								<div key={item.id}>
									<List.Item className={`dp-meta-competence dp-meta-competence--2-step`}>
										<List.Item.Meta
											title={
												<div>
										 			<span style={{
														backgroundColor: scale && scale.color,
														borderColor: scale && scale.color
													}}
													className={`dp-meta__label ${className}`}>
														{item.mark_text}
													</span>
													<span style={{color: '#1890ff'}}>{item.name}</span>
										 		</div>
									 		}
										/>
									</List.Item>
									<List className='dp-list-2-step' itemLayout='horizontal'>
										{item.competence_themes.map(t => {
											return (
												<List.Item key={t.id} className='dp-list-2-meta-theme'>
													<List.Item.Meta
														avatar={<Checkbox checked={t.checked} onChange={e => this.handleCheckedTheme(e, item.id, t.id)}/>}
														title={t.name}
													/>
												</List.Item>
											)
										})}
									</List>
								</div>
							)
						})}
					</List>
				</Card>
			}
			{currentStep === 3 &&
				<Card
					className='dp-meta'
					title='Выберите дополнительные задачи для развития компетенций'
				>
					<List
						className='dp-list'
						itemLayout='horizontal'
					>
						{meta.competences.filter(c => c.checked).map(item => {
							const scale = meta.scales.find(s => s.scale === item.mark_text);
							const className = scale ? 'dp-meta__label--active': '';

							return (
								<div key={item.id} className='dp-meta-competence-container'>
									<List.Item
										className={`dp-meta-competence dp-meta-competence--2-step`}
										actions={[
											<Button className='dp-meta__add-task' type='primary' size='small' ghost onClick={() => this.handleToggleTaskModal(item.id)}>
												Добавить задачу
											</Button>
										]}
									>
										<List.Item.Meta
											title={
												<div>
										 			<span style={{
														backgroundColor: scale && scale.color,
														borderColor: scale && scale.color
													}}
													className={`dp-meta__label ${className}`}>
														{item.mark_text}
													</span>
													<span style={{color: '#1890ff'}}>{item.name}</span>
										 		</div>
									 		}
										/>
									</List.Item>
									{this.renderTasks(item.id, item.tasks)}
								</div>
							)
						})}
					</List>
				</Card>
			}
			<div className='clearfix' />
			{this.renderButtons()}
			{this.renderTaskModal()}
		</div>)
	}
}

function mapStateToProps(state){
	return {
		meta: state.idp.meta.main
	}
}

export default withRouter(connect(mapStateToProps, { getMeta, onCompetenceChecked, onThemeChecked, onSaveTask, onDeleteTask, saveIdp })(Meta));