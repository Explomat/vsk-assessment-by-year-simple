import React from 'react';
import { Header, Segment, Label, Icon } from 'semantic-ui-react';
import { computeScaleByPercent } from '../calculations';
import cs from 'classnames';

const Pa = ({ pa, CompetenceContainer, ...props }) => {

	const renderResultMark = (resultMark) => {
		const { rules } = props;
		return resultMark && (
			<Label
				size='large'
				className='assessment-profile__label'
				style={{
					backgroundColor: rules[resultMark].color,
					borderColor: rules[resultMark].color,
					float: 'right'
				}}
			>
				{resultMark}
			</Label>
		);
	}

	const resultMark = computeScaleByPercent(pa.overall, props);
	const renderedResultMark = renderResultMark(resultMark);
	return (
		<div key={pa.id} className='assessment-profile__pa'>
			{props.isHeaderOpened && <div className='assessment-profile__pa_header' onClick={() => props.onTogglePa(pa.id)}>
				<Header as='h3'>
					{/*!ui.pas[pa.id] ? <Icon name='angle up' /> : <Icon name='angle down' /> */}
					{props.isOpened ? <Icon name='angle down' /> : <Icon name='angle right' />}
					<Header.Content style={{ width: '100%' }}>{pa.statusName} {renderedResultMark}</Header.Content>
				</Header>
			</div>}
			<div className={cs({
				'assessment-profile__pa-content':  true,
				'assessment-profile__pa-content--visible': props.isOpened
			})}>
				<div className='assessment-profile__competences'>
					{pa.competences.map(c => <CompetenceContainer
							isDisabled={props.isDisabled}
							key={c}
							id={c}
							paId={pa.id}
						/>
					)}
				</div>
				<Header floated='right' as='h3'>Итоговый результат 
					{renderedResultMark}
				</Header>
			</div>
		</div>
	);
}

export default Pa;