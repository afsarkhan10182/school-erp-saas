// SIMPLIFIED saveSchedule function - What you want!

const saveSchedule = async () => {
  try {
    saving.value = true;

    // 1. Get or create timetable (simple)
    let timetableId = timetable.value?.id;
    if (!timetableId) {
      const existingTimetables = await Timetables.getAll({
        class_id: form.value.class_id,
        section_id: form.value.section_id || null,
        academic_year: selectedAcademicYear.value
      });

      if (existingTimetables.success && existingTimetables.data.timetables.length > 0) {
        timetableId = existingTimetables.data.timetables[0].id;
      } else {
        const timetableData = {
          name: `${selectedClass.value} ${selectedSection.value || 'All Sections'} Timetable`,
          class_id: form.value.class_id,
          section_id: form.value.section_id || null,
          academic_year: selectedAcademicYear.value,
          is_active: true
        };
        const timetableResponse = await Timetables.create(timetableData);
        if (timetableResponse.success) {
          timetableId = timetableResponse.data.timetable.id;
        } else {
          showToast('Failed to create timetable', 'error');
          return;
        }
      }
    }

    // 2. Simple validation
    for (const slot of form.value.slots) {
      if (!slot.start_time || !slot.end_time) {
        showToast('Please fill in all time fields', 'error');
        return;
      }
      if (!slot.is_break && (!slot.subject_id || !slot.teacher_id)) {
        showToast('Please select subject and teacher for all non-break slots', 'error');
        return;
      }
    }

    // 3. Process each slot - update existing or create new
    for (const slot of form.value.slots) {
      const slotData = {
        day_of_week: form.value.day_of_week,
        period_number: slot.period_number || 1,
        start_time: slot.start_time.substring(0, 5),
        end_time: slot.end_time.substring(0, 5),
        subject_id: slot.is_break ? null : slot.subject_id,
        teacher_id: slot.is_break ? null : slot.teacher_id,
        room_number: slot.room_number,
        slot_type: slot.is_break ? 'break' : 'regular'
      };

      if (slot.id) {
        // Update existing slot
        await Timetables.updateSlot(timetableId, slot.id, slotData);
      } else {
        // Create new slot
        await Timetables.createSlot({
          timetable_id: timetableId,
          ...slotData
        });
      }
    }

    showToast('Schedule saved successfully', 'success');
    closeAddModal();
    await loadSchedule();
  } catch (error) {
    console.error('Error saving schedule:', error);
    showToast(`Error: ${error.response?.data?.message || error.message}`, 'error');
  } finally {
    saving.value = false;
  }
};

// This is what you want:
// 1. Get timetable ID (simple)
// 2. Validate form (simple)
// 3. For each slot: if has ID = update, if no ID = create
// 4. Done!

// Current function: 200+ lines of complex logic
// Simplified function: 50 lines of simple logic
