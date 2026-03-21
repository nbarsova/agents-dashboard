import { useEffect, useReducer } from 'react';

import { getTeamMembers } from '../../api/team-members';
import TeamMemberForm from './components/TeamMemberForm';
import TeamMemberItem from './components/TeamMemberItem';
import {
  initialState,
  TeamMembersDispatchContext,
  teamMembersReducer,
  TeamMembersStateContext,
} from './TeamMembersContext';

const TeamMembers = () => {
  const [state, dispatch] = useReducer(teamMembersReducer, initialState);

  const { loading, error, members } = state;

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const data = await getTeamMembers();
      dispatch({ type: 'SET_MEMBERS', payload: data });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load team members',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  return (
    <TeamMembersStateContext.Provider value={state}>
      <TeamMembersDispatchContext.Provider value={dispatch}>
        <div className="max-w-3xl mx-auto p-8">
          <h1 className="mb-6 text-gray-900 text-2xl font-bold">Team Members</h1>
          {error && <div className="bg-red-100 text-red-800 p-4 rounded mb-4">{error}</div>}

          <TeamMemberForm />
          {loading ? (
            <div className="text-center p-8 text-gray-500">Loading...</div>
          ) : members.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No team members yet. Add one above!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {members.map((member) => (
                <TeamMemberItem member={member} key={member.id} />
              ))}
            </div>
          )}
        </div>
      </TeamMembersDispatchContext.Provider>
    </TeamMembersStateContext.Provider>
  );
};

export default TeamMembers;
