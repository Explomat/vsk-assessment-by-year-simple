import React, { PureComponent } from 'react';
import { Icon, Table, Label, Popup, List, Segment, Header, Modal } from 'semantic-ui-react';
import TextareaAutosize from 'react-textarea-autosize';
import pSBC from '../../utils/pSBC';
import cs from 'classnames';
import {
	isCompetenceCompleted,
	isCommentRequire,
	commonId
} from '../calculations';

import './competence.css';


class Competence extends PureComponent {

	constructor(props) {
		super(props);

		this.handleChangeMark = this.handleChangeMark.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleToggDescription = this.handleToggDescription.bind(this);

		this.compRef = React.createRef();

		this.state = {
			isShowDescription: false
		}
	}

	handleToggDescription() {
		this.setState({
			isShowDescription: !this.state.isShowDescription
		});
	}

	handleFocus(compId, markName){
		const { competences, commonCompetences } = this.props;
		const userComp = competences[compId];
		const commonComp = commonCompetences[commonId(compId)];
		if (isCommentRequire(commonComp.scales, markName) && userComp.comment.trim() == '') {
			this.compRef.current.focus();
		}
	}

	handleChangeMark(scale){
		const { paId, id, onUpdatePa } = this.props;
		onUpdatePa(paId, id, scale);
		this.handleFocus(id, scale.name);
	}

	render(){
		const {
			id,
			isDisabled,
			competences,
			commonCompetences,
			indicators,
			commonIndicators,
			rules,
			changeComment
		} = this.props;

		const userComp = competences[id];
		const commonComp = commonCompetences[commonId(id)];
		const mark = userComp.mark_text;
		const isRequireComment = isCommentRequire(commonComp.scales, userComp.mark_text) && userComp.comment.trim() == '';
		const { isShowDescription } = this.state;
		//const mark = computeCompetenceMark(id, this.props);

		return(
			<Segment className='assessment-profile__competences-container'>
				<Label className='fluid' size='large'>
					{mark && <Label className='assessment-profile__label' size='large' style={{
						backgroundColor: rules[mark].color,
						borderColor: pSBC(-0.5,rules[mark].color)
					}} ribbon>
						<strong>{mark}</strong>
					</Label>}
					{commonComp.name}
					{isCompetenceCompleted(id, this.props) &&
						<Icon className='assessment-profile__competences-container-complete' size='large' color='green' name='check' />
					}
				</Label>
				<Table
					celled
					size='small'
					className='assessment-profile__competence'
					style={{ margin: 0 }}
				>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell>Шкала оценки</Table.HeaderCell>
							<Table.HeaderCell>Подтверждающий пример</Table.HeaderCell>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						<Table.Row>
							<Table.Cell
								textAlign='left'
								width={3}
								disabled={isDisabled}
							>
								<Label.Group>
									{commonComp.scales.map(s => {
										const scale = rules[s.name];
										return (
											<Popup
												key={s.id}
												size='mini'
												position='top right'
												trigger={
													<Label
														className={`assessment-profile__label ${cs({
															'assessment-profile__label--active' : userComp.mark_text === s.name
														})}`}
														style={{
															backgroundColor: scale.color,
															borderColor: scale.color
														}}
														as='a'
														onClick={() => this.handleChangeMark(s)}
													>
														{userComp.mark_text === s.name && <Icon name='check' />}
														{s.name}
													</Label>
												}
												content={s.desc}
											/>
										);
									})}
								</Label.Group>
							</Table.Cell>
							<Table.Cell width={3} style={{ position: 'relative' }}>
								<TextareaAutosize
									inputRef={this.compRef}
									className={
										cs({
											'assessment-profile__competences-container__text-area': true,
											'assessment-profile__competences-container__text-area--error': isRequireComment
										})
									}
									minRows={1}
									maxRows={3}
									placeholder='Пример'
									value={userComp.comment}
									disabled={isDisabled}
									onChange={(e) => changeComment(id, e.target.value)}
								/>
								{isRequireComment && <Label size='tiny' className='assessment-profile__competences-container-tooltip' basic color='red' pointing='below'>
									Заполните это поле
								</Label>}
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table>
				{/*<div className='assessment-profile__indicators-container'>

					<Header as='h4'>Индикаторы</Header>
					<List ordered>
						{
							userComp.indicators.map(i => {
								const commonInd = commonIndicators[commonId(i)];
								return (
									<List.Item className='assessment-profile__indicators-container-item' key={i}>{commonInd.name}</List.Item>
								);
							})
						}
					</List>
				</div>*/}
				<div className='assessment-profile__competence-description-container'>
					<a className='assessment-profile__competence-description-a' onClick={this.handleToggDescription}>
						<Icon name='file alternate outline' />
						Описание компетенций
					</a>
				</div>
				{isShowDescription &&
					<Modal size='large' open closeIcon onClose={this.handleToggDescription}>
						<Modal.Header>{commonComp.name}</Modal.Header>
						<Modal.Content scrolling>
							<Modal.Description>
								<Segment basic>
									<Header as='h4' className='assessment-profile__competence-description-header'>Описание</Header>
									{userComp.common_comment}
								</Segment>
								<Segment basic>
									<Header as='h4' className='assessment-profile__competence-description-header assessment-profile__competence-description-header--positive'>Развита</Header>
									{userComp.common_positive_comment}
								</Segment>
								<Segment basic>
									<Header as='h4' className='assessment-profile__competence-description-header assessment-profile__competence-description-header--overdeveloped'>Чрезмерно развита</Header>
									{userComp.common_overdeveloped_comment}
								</Segment>
								<Segment basic>
									<Header as='h4' className='assessment-profile__competence-description-header assessment-profile__competence-description-header--negative'>Не развита</Header>
									{userComp.common_negative_comment}
								</Segment>
							</Modal.Description>
						</Modal.Content>
					</Modal>
				}
			</Segment>
		);
	}
}

export default Competence;