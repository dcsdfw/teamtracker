import { addScheduleRule, getScheduleRules as getScheduleRulesFromService, deleteScheduleRule as deleteScheduleRuleFromService } from './services/scheduleService';

// Test function to add a schedule rule
export async function addTestScheduleRule() {
  try {
    const testRule = {
      name: "TEST",
      facilityId: "TEST",
      rrule: "FREQ=DAILY;COUNT=5",
      color: "#ff0000",
      notes: "Five‑day test"
    };

    const result = await addScheduleRule(testRule);
    console.log('✅ Test schedule rule added successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error adding test schedule rule:', error);
    throw error;
  }
}

// Function to get all schedule rules
export async function getScheduleRules() {
  try {
    const rules = await getScheduleRulesFromService();
    console.log('📋 Schedule rules:', rules);
    return rules;
  } catch (error) {
    console.error('❌ Error getting schedule rules:', error);
    throw error;
  }
}

// Function to delete a schedule rule
export async function deleteScheduleRule(ruleId: string) {
  try {
    const result = await deleteScheduleRuleFromService(ruleId);
    console.log('✅ Schedule rule deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting schedule rule:', error);
    throw error;
  }
} 