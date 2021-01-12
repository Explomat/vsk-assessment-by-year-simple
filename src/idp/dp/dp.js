import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Spin, List, Button, Modal, Input, PageHeader, Row, Col, Steps, Card, Tag, Table } from 'antd';
import { CheckOutlined, DownloadOutlined, ArrowRightOutlined } from '@ant-design/icons';
import Task from './task';
import TaskForm from './taskForm';
import { renderDate } from '../../utils/date';
import { connect } from 'react-redux';
import { getDp, changeStep, addTask, updateTask, removeTask } from './dpActions';
import { loading } from '../appActions';
import { createBaseUrl } from '../../utils/request';
import { calculatePercent } from './utils/calculate';
import './index.css';
import 'antd/es/table/style/index.css';

const UserDescription = ({ ...props }) => (
	<Col>
		<div className='description'>
			<div className='term'>{props.children}</div>
			<a className='detail' target='__blank' href={`/view_doc.html?mode=collaborator&object_id=${props.id}`}>{props.fullname}</a>
		</div>
	</Col>
);

class Dp extends Component {

	constructor(props){
		super(props);

		this.state = {
			isShowModalTask: false,
			isShowModalComment: false,
			comment: ''
		}

		this.currentAction = null;
		this.handleToggleTaskModal = this.handleToggleTaskModal.bind(this);
		this.handleAddTask = this.handleAddTask.bind(this);
		this.handleChangeStep = this.handleChangeStep.bind(this);
		this.handeAction = this.handeAction.bind(this);
		this.handleToggleCommentModal = this.handleToggleCommentModal.bind(this);
		this.handleChangeComment = this.handleChangeComment.bind(this);
	}

	componentDidMount(){
		const { match, getDp } = this.props;
		getDp(match.params.id, match.params.dp_id);
		//this.props.loading(true);
	}

	handleToggleTaskModal(){
		this.setState({
			isShowModalTask: !this.state.isShowModalTask
		});
	}

	handleToggleCommentModal(){
		this.setState({
			isShowModalComment: !this.state.isShowModalComment,
			comment: ''
		});
	}

	handleChangeComment ({ target: { value } }) {
		this.setState({ comment: value });
	}

	handeAction(action){
		const { changeStep } = this.props;

		if (action.allow_additional_data === 'true'){
			this.currentAction = action;
			this.handleToggleCommentModal();
		} else {
			changeStep(action.name);
		}
	}

	handleChangeStep(isComment){
		const { changeStep } = this.props;
		const comment = isComment ? this.state.comment : null;
		changeStep(this.currentAction.name, comment);
		this.handleToggleCommentModal();
	}

	handleAddTask(task){
		const { addTask } = this.props;
		addTask(task);
		this.handleToggleTaskModal();
	}

	renderHeader() {
		const { card, history  } = this.props;
		const cdate = () => 'с ' + renderDate(card.create_date) + ' ' + (card.plan_date ? `по ${renderDate(card.plan_date)}` : '');
		const rurl = createBaseUrl('idp', 'Report', { cr_id: card.id });

		return (	
			<PageHeader
				onBack={history.goBack}
				title={<span>{card.person_fullname}</span>}
				extra={[
					<Tag key='date' color='green'>{cdate()}</Tag>,
					<div key='status' className='detail'>Статус: <span className='dp__status'>{card.state_name}</span></div>,
					<a style={{ 'paddingTop': '12px', display: 'block' }} key='report' href={rurl} className='term'>Скачать отчет <DownloadOutlined /></a>
				]}
			>
				<div className='wrap'>
					<div className='content padding'>
						{card.managers && card.managers.map(t => {
							return (
								<Row key={t.id} style={{ width: '70%' }}>
									<UserDescription {...t}>{t.expert_person_type_name}</UserDescription>
								</Row>
							);
						})}
						<Row style={{ width: '70%' }}>
							<Col>
								<div className='description'>
									<div className='term'>Текущий этап</div>
									<div className='detail dp__current-step'>{card.main_step_name} / {card.step_name}</div>
								</div>
							</Col>
						</Row>
					</div>
				</div>
			</PageHeader>
		);
	}

	renderMainSteps(){
		const { card } = this.props;
		const curStepIndex = card.main_steps.findIndex(s => s.id === card.main_step_id);
		return (
			<div className='dp__steps'>
				<Steps progressDot current={curStepIndex}>
					{card.main_steps &&
						card.main_steps.map((s, index) => (
							<Steps.Step
								key={s.id}
								title={
									<span>
										<span className='dp__date'>{renderDate(s.date)}</span>
										{/*s.is_approved ? <CheckOutlined className='adaptation__date-check' /> : null*/}
									</span>
								}
								description={s.name}
							/>)
						)}
				</Steps>
			</div>
		);
	}

	renderCompetenceAndThemes() {
		const { card } = this.props;
		const competences = {};

		card.competence_and_themes.forEach(cat => {
			if (!competences[cat.competence_id]) {
				competences[cat.competence_id] = {
					id: cat.competence_id,
					name: cat.competence_name,
					comment: cat.competence_comment,
					themes: []
				};
			}

			competences[cat.competence_id].themes.push({
				id: cat.theme_id,
				name: cat.theme_name,
				percent_complete: cat.percent_complete
			});
		});

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
			}
		];

		return (
			Object.keys(competences).map(c =>
				<Card
					key={competences[c].id}
					title={competences[c].name}
					className='dp__competence-and-themes'
					extra={
						card.meta.allow_add_themes ? (
							<Button className='dp__themes-add' type='primary' ghost onClick={this.handleToggleThemeModal}>
								Добавить тему
							</Button>
						) : null
					}
				>
					<Table dataSource={competences[c].themes} columns={themeColumns} rowKey='id' pagination={false}/>
				</Card>
			)
		);
	}

	renderTasks(tasks) {
		const { card, updateTask, removeTask } = this.props;
		if (tasks) {
			const columns = [
				{
					title: 'Тип задачи',
					dataIndex: 'task_type_name',
					key: 'task_type_name'
				},
				{
					title: 'Поля для выбора/заполнения',
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
				}
			];
			return (
				<div>
					<div className='ant-table-wrapper'>
						<div className='ant-spin-nested-loading'>
							<div className='ant-table ant-table-default ant-table-scroll-position-left'>
								<div className='ant-table-content'>
									<div className='ant-table-body'>
										<table>
											<colgroup><col/><col/><col/></colgroup>
											<thead className='ant-table-thead'>
												<tr>
												{columns.map(c => {
													return (
														<th key={c.key}>
															<span className='ant-table-header-column'>
																<div>
																	<span className='ant-table-column-title'>
																		{c.title}
																	</span>
																</div>
															</span>
														</th>
													);
												})}
												</tr>
											</thead>
											<tbody className='ant-table-tbody'>
												{tasks.map(t => {
													return (
														<Task
															key={t.id}
															updateTask={updateTask}
															removeTask={removeTask}
															task_types={card.task_types}
															meta={card.meta}
															{...t}
														/>
													);
												})}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			);	
		}
	}

	renderHistory(){
		const { card } = this.props;

		return (
			<Card className='dp__history' title='История этапов'>
				<List>
					{card.main_flows.map(t => {
						return (
							<List.Item
								key={t.id}
							>
								 <List.Item.Meta
								 	title={<span>
								 		<span className='dp__date'>{renderDate(t.created_date)}</span>
								 		<span className='dp__history-step'>{t.idp_main_step_name} / {t.idp_step_name}</span>
								 	</span>}
								 />
								 <div>{t.current_collaborator_fullname} <ArrowRightOutlined /> {t.next_collaborator_fullname}</div>
								 {t.comment && (
								 	<div className='dp__history-data'>
								 		Комментарий: 
								 		<div className='dp__history-comment'>{t.comment}</div>
								 	</div>
								 )}
							</List.Item>
						)
					})}
				</List>
			</Card>
		);
	}

	render() {
		const { card, ui } = this.props;
		const { isShowModalTask } = this.state;
		const { isShowModalComment, comment } = this.state;
		return (
			<Spin spinning={ui.isLoading}>
				<div className='dp'>
					{ this.renderHeader() }
					<div className='dp__body'>
						{this.renderMainSteps()}
						<div className='dp__competence-and-themes-container'>
							<div className='dp__title'>Обязательные обучения для развития компетенций</div>
							{this.renderCompetenceAndThemes()}
						</div>
						<div className='dp__body-competence-tasks'>
							<div className='dp__title'>Дополнительные задачи</div>
							{card.competences.map(c => 
								<Card
									key={c.id}
									className='dp__tasks'
									title={c.name}
									extra={
										card.meta.allow_add_tasks ? (
											<Button className='dp__tasks-add' type='primary' ghost onClick={this.handleToggleTaskModal}>
												Добавить задачу
											</Button>
										) : null
									}
								>
									{this.renderTasks(c.tasks)}
								</Card>
							)}
							<div className='dp__body-competence-tasks-actions'>
								{card.meta.actions && card.meta.actions.map(a => {
									let tasksLen = 0;
									card.competences.forEach(c => {
										tasksLen += c.tasks.length;
									});

									return (
										<Button
												key={a.code}
												disabled={tasksLen === 0}
												className='dp__tasks-actions'
												type='primary'
												onClick={() => this.handeAction(a)}
										>
											{a.name}
										</Button>
									);
								})}
							</div>
						</div>
						{isShowModalTask && <TaskForm
							title='Новая задача'
							onCommit={this.handleAddTask}
							onCancel={this.handleToggleTaskModal}
							task_types={card.task_types}
							meta={card.meta}
						/>}
						<Modal
							title='Сообщение'
							visible={isShowModalComment}
							onOk={() => this.handleChangeStep(true)}
							onCancel={this.handleToggleCommentModal}
							footer={[
								<Button key='submit' onClick={() => this.handleChangeStep(true)}>
									Ok
								</Button>,
								<Button key='cancel' onClick={this.handleToggleCommentModal}>
									Отмена
								</Button>,
								<Button key='submit_wthout_comment' onClick={this.handleChangeStep}>
									Отправить без комментария
								</Button>
							]}
						>
							<Input.TextArea placeholder='Описание' value={comment} autosize={{ minRows: 3}} onChange={this.handleChangeComment}/>
						</Modal>
					</div>
					<div className='dp__footer'>
						{this.renderHistory()}
					</div>
				</div>
			</Spin>
		);
	}
}

function mapStateToProps(state){
	const { idp } = state;
	return {
		card: idp.dp.card,
		ui: idp.dp.ui
	}
}

export default withRouter(connect(mapStateToProps, { getDp, changeStep, addTask, updateTask, removeTask, loading })(Dp));