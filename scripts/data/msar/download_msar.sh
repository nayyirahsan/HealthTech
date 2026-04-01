#!/bin/bash
BASE="https://students-residents.aamc.org"

declare -A PDFS=(
  ["01_campus_address_contact.pdf"]="/media/14526/download?attachment"
  ["02_mission_statement.pdf"]="/media/6966/download?attachment"
  ["03_bsmd_programs.pdf"]="/system/files/2022-12/bs_md_programs_2022_2023_msar_reports_12.12.22_2.pdf"
  ["04_gender_sexual_minority_support.pdf"]="/media/6986/download?attachment"
  ["05_admission_policies.pdf"]="/media/6991/download?attachment"
  ["06_applications_accepted.pdf"]="/media/6996/download?attachment"
  ["07_secondary_application.pdf"]="/media/7011/download?attachment"
  ["08_application_transfer_policies.pdf"]="/media/7021/download?attachment"
  ["09_letter_of_evaluation.pdf"]="/media/7026/download?attachment"
  ["10_daca_policies.pdf"]="/media/7031/download?attachment"
  ["11_mcat_test_dates.pdf"]="/media/7036/download?attachment"
  ["12_premedical_coursework.pdf"]="/media/7041/download?attachment"
  ["13_preview_exam_policies.pdf"]="/media/7046/download?attachment"
  ["14_community_college_coursework.pdf"]="/media/15766/download?attachment"
  ["15_interview_policies.pdf"]="/media/7051/download?attachment"
  ["16_waitlist_procedures.pdf"]="/media/7056/download?attachment"
  ["17_debt_information.pdf"]="/media/7061/download?attachment"
  ["18_deposit_due_date.pdf"]="/media/7066/download?attachment"
  ["19_tuition_fees_insurance.pdf"]="/media/7071/download?attachment"
)

for filename in $(echo "${!PDFS[@]}" | tr ' ' '\n' | sort); do
  path="${PDFS[$filename]}"
  echo "Downloading $filename..."
  curl -sL -o "$filename" "${BASE}${path}"
  size=$(wc -c < "$filename" | tr -d ' ')
  echo "  → $size bytes"
done

echo ""
echo "Done. Downloaded ${#PDFS[@]} files."
