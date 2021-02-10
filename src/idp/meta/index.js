import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Card, Checkbox, Button, List, Table } from 'antd';
import TaskForm from './TaskForm';
import { DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { getMeta, onCompetenceChecked, onThemeChecked, onSaveTask, onDeleteTask, saveIdp, onChangeStep, resetState } from './metaActions';
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
		//this.renderConfirm = this.renderConfirm.bind(this);
		this.renderTasks = this.renderTasks.bind(this);
		this.renderButtons = this.renderButtons.bind(this);
		this.renderTaskModal = this.renderTaskModal.bind(this);

		this.state = {
			isShowConfirm: false,
			isShowTaskForm: false
		}

		props.resetState();

		this.currentCompetenceId = null;
	}

	componentDidMount(){
		const { match, getMeta, dpId } = this.props;
		getMeta(match.params.id, dpId);
	}

	handleSave() {
		const { match, saveIdp } = this.props;
		saveIdp(match.params.id);
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
		const { ui, onChangeStep } = this.props;
		onChangeStep(ui.currentStep - 1);
	}

	handleNextStep() {
		const { ui, onChangeStep } = this.props;
		onChangeStep(ui.currentStep + 1);
	}

	handleCheckedTheme(e, competenceId, themeId) {
		this.props.onThemeChecked(e.target.checked, competenceId, themeId);
	}

	/*renderConfirm() {
		const { selectedNode } = this.props;

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
					<p>{`Вы действительно хотите выбрать "${selectedNode && selectedNode.name}" ?`}</p>
					<p>Будьте внимательны, эти данные нельзя будет изменить.</p>
				</span>
			</Modal>
		);
	}*/

	renderTasks(competenceId, tasks = []) {
		const { task_types, onDeleteTask } = this.props;

		const columns = [
			{
				title: 'Тип задачи',
				dataIndex: 'idp_task_type_id',
				key: 'idp_task_type_id',
				render: id => task_types.find(tp => tp.id === id).name
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
		const { ui, hasChecked } = this.props;
		const buttons = [];

		const buttonNext = <Button key='1' disabled={!(ui.currentStep === 1 && hasChecked)} className='clearfix' style={{float: 'right'}} onClick={this.handleNextStep}><RightOutlined /></Button>;
		const buttonPrev = <Button key='2' disabled={!(ui.currentStep <= ui.stepsCount && ui.currentStep !== 1)} className='clearfix' style={{float: 'right', marginRight: '20px'}} onClick={this.handlePrevStep}><LeftOutlined /></Button>;
		buttons.push(buttonNext);
		buttons.push(buttonPrev);

		//const buttonSave = <Button onClick={this.handleSave} key='3' className='clearfix' type='primary' style={{float: 'right'}} onClick={this.handleSave}>Сохранить</Button>;

		/*if (ui.currentStep <= ui.stepsCount && ui.currentStep !== 1) {
			buttons.push(buttonPrev);
		}

		if (ui.currentStep === 1 && hasChecked) {
			buttons.push(buttonNext);
		}*/ /*else if (currentStep === 2 && meta.hasThemesChecked) {
			buttons.push(buttonNext);
		} else if (currentStep === (stepsCount - 1)) {
			buttons.push(buttonSave);
		}*/

		return <div className='dp-meta__buttons clearfix'>{buttons}</div>;
	}

	renderTaskModal() {
		const { isShowTaskForm } = this.state;
		const { task_types } = this.props;
		//const comp = competences.find(c => c.id === this.currentCompetenceId);

		if (isShowTaskForm) {
			return (
				<TaskForm
					type='Collaborators'
					onCommit={this.handleSaveTask}
					onCancel={this.handleToggleTaskModal}
					task_types={task_types}
				/>
			);
		}
	}

	render() {
		const { ui, competences, scales } = this.props;

		if (ui.isLoading) {
			return null;
		}

		return (<div>
			{ui.currentStep === 1 &&
				<Card className='dp-meta' title='Компетенции'>
					<div className='dp-meta__description'>Выберите одну или две компетенции для развития, а затем темы обучения. При выборе одной компетенции, в следующем шаге, нужно выбрать две темы обучения по ней. При выборе двух компетенций – нужно выбрать по одной теме обучения на каждую</div>
					<List
						className='dp-list'
						itemLayout='horizontal'
					>
						{competences.map(item => {
							const scale = scales.find(s => s.scale === item.mark_text);
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
					{this.renderButtons()}
				</Card>
			}
			{ui.currentStep === 2 &&
				<Card className='dp-meta' title='Темы обучений для развития компетенций'>
					<div className='dp-meta__description'>Выберите темы для развития</div>
					<List
						className='dp-list'
						itemLayout='horizontal'
					>
						{competences.filter(c => c.checked).map(item => {
							const scale = scales.find(s => s.scale === item.mark_text);
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
										{item.themes.map(t => {
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
					{this.renderButtons()}
				</Card>
			}
			{/*currentStep === 3 &&
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
			*/}
			<div className='clearfix' />
			{/*this.renderTaskModal()*/}
		</div>)
	}
}

function mapStateToProps(state){
	return {
		...state.idp.meta
	}
}

export default withRouter(connect(mapStateToProps, { getMeta, onCompetenceChecked, onThemeChecked, onSaveTask, onDeleteTask, saveIdp, onChangeStep, resetState })(Meta));