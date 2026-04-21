import { type Todo, type AppData, type Persona } from './types';

export function todoMatchesSearch(
  t: Todo,
  search: string,
  data: Pick<AppData, 'people' | 'families'>
): boolean {
  if (!search) return true;
  const q = search.toLowerCase();
  if (t.title.toLowerCase().includes(q)) return true;
  if (t.personId) {
    const p = data.people.find((p) => p.id === t.personId);
    if (p?.englishName.toLowerCase().includes(q) || p?.chineseName?.toLowerCase().includes(q))
      return true;
  }
  if (t.familyId) {
    const f = data.families.find((f) => f.id === t.familyId);
    if (f?.label.toLowerCase().includes(q)) return true;
  }
  return false;
}

export function todoMatchesShepherdFilter(
  t: Todo,
  shepherdFilter: string[],
  currentPersona: Persona,
  data: Pick<AppData, 'personas' | 'families'>
): boolean {
  if (shepherdFilter.length === 0) return true;
  return shepherdFilter.some((sid) => {
    const ids =
      sid === 'mine'
        ? currentPersona.assignedPeopleIds
        : (data.personas.find((p) => p.id === sid)?.assignedPeopleIds ?? []);
    if (t.personId) return ids.includes(t.personId);
    if (t.familyId) {
      const family = data.families.find((f) => f.id === t.familyId);
      return family ? family.memberIds.some((mid) => ids.includes(mid)) : false;
    }
    return t.createdBy === currentPersona.id;
  });
}

export function filterTodos(
  todos: Todo[],
  {
    isAdmin,
    currentPersona,
    shepherdFilter,
    search,
    data,
  }: {
    isAdmin: boolean;
    currentPersona: Persona;
    shepherdFilter: string[];
    search: string;
    data: Pick<AppData, 'people' | 'families' | 'personas'>;
  }
): Todo[] {
  return todos.filter((t) => {
    const matchesSearch = todoMatchesSearch(t, search, data);
    if (isAdmin) {
      return todoMatchesShepherdFilter(t, shepherdFilter, currentPersona, data) && matchesSearch;
    }
    const inScope = (() => {
      if (t.createdBy === currentPersona.id) return true;
      if (t.personId && currentPersona.assignedPeopleIds.includes(t.personId)) return true;
      if (t.familyId) {
        const family = data.families.find((f) => f.id === t.familyId);
        if (family && family.memberIds.some((mid) => currentPersona.assignedPeopleIds.includes(mid)))
          return true;
      }
      return false;
    })();
    return inScope && matchesSearch;
  });
}
