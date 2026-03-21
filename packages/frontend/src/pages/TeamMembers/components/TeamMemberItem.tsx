import type { TeamMember } from '@template/shared';
import { FC } from 'react';

import { deleteTeamMember } from '../../../api/team-members';
import { useTeamMembersDispatch } from '../TeamMembersContext';

interface TeamMemberItemProperties {
  member: TeamMember;
}

const TeamMemberItem: FC<TeamMemberItemProperties> = ({ member }) => {
  const dispatch = useTeamMembersDispatch();

  function handleEdit() {
    dispatch({ type: 'SET_EDITING_ID', payload: member.id });
    dispatch({
      type: 'SET_FORM_DATA',
      payload: {
        name: member.name,
        description: member.description || '',
        gitHandle: member.gitHandle,
      },
    });
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      await deleteTeamMember(member.id);
      dispatch({ type: 'DELETE_MEMBER', payload: member.id });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to delete team member',
      });
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-semibold">{member.name}</h2>
        <span className="text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded text-sm">
          @{member.gitHandle}
        </span>
      </div>
      {member.description && <p className="text-gray-600 my-2 mb-4">{member.description}</p>}
      <div className="flex gap-2">
        <button
          className="px-4 py-2 text-sm rounded cursor-pointer transition-colors bg-gray-500 text-white hover:bg-gray-600"
          onClick={handleEdit}
        >
          Edit
        </button>
        <button
          className="px-4 py-2 text-sm rounded cursor-pointer transition-colors bg-red-600 text-white hover:bg-red-700"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TeamMemberItem;
