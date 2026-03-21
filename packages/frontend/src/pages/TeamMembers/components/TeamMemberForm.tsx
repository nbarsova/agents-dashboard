import { FormEvent } from 'react';

import { createTeamMember, updateTeamMember } from '../../../api/team-members';
import { useTeamMembersDispatch, useTeamMembersState } from '../TeamMembersContext';

const TeamMemberForm = () => {
  const { formData, editingId } = useTeamMembersState();
  const dispatch = useTeamMembersDispatch();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      if (editingId) {
        const updated = await updateTeamMember(editingId, formData);
        dispatch({ type: 'UPDATE_MEMBER', payload: updated });
      } else {
        const created = await createTeamMember(formData);
        dispatch({ type: 'ADD_MEMBER', payload: created });
      }
      dispatch({ type: 'RESET_FORM' });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to save team member',
      });
    }
  }

  function handleCancel() {
    dispatch({ type: 'RESET_FORM' });
  }

  return (
    <form className="bg-white p-6 rounded-lg shadow-md mb-8" onSubmit={handleSubmit}>
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="name" className="block mb-2 font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              dispatch({ type: 'SET_FORM_DATA', payload: { ...formData, name: e.target.value } })
            }
            required
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-dps-blue-600"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="gitHandle" className="block mb-2 font-medium">
            Git Handle
          </label>
          <input
            id="gitHandle"
            type="text"
            value={formData.gitHandle}
            onChange={(e) =>
              dispatch({
                type: 'SET_FORM_DATA',
                payload: { ...formData, gitHandle: e.target.value },
              })
            }
            placeholder="@username"
            required
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-dps-blue-600"
          />
        </div>
      </div>
      <div className="flex-1 mb-4">
        <label htmlFor="description" className="block mb-2 font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            dispatch({
              type: 'SET_FORM_DATA',
              payload: { ...formData, description: e.target.value },
            })
          }
          placeholder="Role, skills, or other details..."
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-20"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-6 py-3 rounded cursor-pointer transition-colors bg-dps-blue-500 text-white hover:bg-dps-blue-600"
        >
          {editingId ? 'Update' : 'Add'} Member
        </button>
        {editingId && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 rounded cursor-pointer transition-colors bg-gray-500 text-white hover:bg-gray-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TeamMemberForm;
