WITH tree (id, level, s) as 
(
	select
		object_id,
		0 as level,
		convert(varchar(max), ss.name)
	from func_managers
	inner join subdivisions ss on ss.id = parent_id

	UNION ALL

	SELECT
		c2.object_id,
		tree.level + 1,
		s + '~' +  convert(varchar(max), ss2.name)
	FROM func_managers c2 
	INNER JOIN tree ON tree.id = c2.parent_id
	inner join subdivisions ss2 on ss2.id = c2.parent_id
)


select
	cs.fullname,
	cs.code,
	cs.position_parent_name,
	cs.position_name,
	cs.hire_date,
	cs.dismiss_date,
	'Оценка компетенций' as [description],
	p.overall as self_pa,
	p1.overall as boss_pa,
	(case
		when aps.is_done = 0 or aps.is_done is NULL
			then 'Не завершена'
			else 'Завершена'
		end) as is_done,
	 t.s
from tree t
inner join collaborators cs on cs.id = t.id
left join assessment_plans aps on aps.person_id = cs.id
left join pas p on p.person_id = cs.id and p.expert_person_id = cs.id
left join pas p1 on p1.person_id = cs.id and p1.expert_person_id <> cs.id
inner join (
	SELECT max(level) level, id
	FROM tree t
	group by id
) t1
	on t1.id = t.id
	and t1.level = t.level