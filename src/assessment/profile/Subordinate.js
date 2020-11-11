import React from 'react';
import { assessmentSteps } from '../config/steps';
import { Popup, Label, List, Image, Icon, Checkbox } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { computeScaleByPercent } from '../calculations';

const Subordinate = ({ subordinate, rules, meta, onShow, onSelect }) => {
	const handleClick = (event, data) => {
		event.stopPropagation();
		onSelect(subordinate.id, data.checked);
	}

	const overallMark = computeScaleByPercent(subordinate.assessment.overall, { rules });
	return (
		<List.Item key={subordinate.id} className='assessment-profile-subordinate' onClick={() => onShow(subordinate.id)}>
			{overallMark && (<List.Content floated='right'>
				<Popup
					key={subordinate.id}
					size='mini'
					position='bottom center'
					trigger={
						<Label
							size='big'
							className='assessment-profile__label'
							style={{
								backgroundColor: rules[overallMark] && rules[overallMark].color,
								borderColor: rules[overallMark] && rules[overallMark].color,
							}}
						>
							{overallMark}
						</Label>
					}
					content={rules[overallMark] && rules[overallMark].description}
				/>
			</List.Content>)}

			{!meta.isAssessmentCompleted && <Checkbox checked={subordinate.checked} onClick={handleClick} className='assessment-profile-subordinate__check'/>}
			{subordinate.avatarUrl ? <Image className='assessment-profile-subordinate__avatar-icon' avatar src={subordinate.avatarUrl} /> : <Icon className='assessment-profile-subordinate__avatar-icon' size='big' color='blue' name='user' />}
			<List.Content>
				<List.Header>{subordinate.fullname}</List.Header>
				<List.Description>{subordinate.department} -> {subordinate.position}</List.Description>
				<List.Description>
					<p className='assessment-profile-subordinate__decription'>
						{subordinate.assessment.stepName}
					</p>
				</List.Description>
			</List.Content>
			
		</List.Item>
	);
}

function mapStateToProps(state){
	const { profile } = state.app;
	return {
		rules: profile.rules,
		meta: profile.result.meta
	}
}

export default connect(mapStateToProps)(Subordinate);