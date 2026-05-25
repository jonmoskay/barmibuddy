"use client";

import { FormEvent, useMemo, useState } from "react";

type Lineage = "Cohen" | "Levi" | "Yisrael";
type ServiceTime = "Morning" | "Afternoon";
type SectionType = "Maftir" | "Haftarah" | "Custom Aliyah";

type StudentSetup = {
  id: string;
  studentName: string;
  hebrewName: string;
  fatherName: string;
  motherName: string;
  lineage: Lineage;
  barMitzvahDate: string;
  serviceTime: ServiceTime;
  sectionType: SectionType;
  customAliyah: string;
  textReference: string;
  parashaConfirmed: string;
  fetchedRef: string;
  fetchedHeRef: string;
  hebrewText: string;
  englishText: string;
  textAttribution: TextAttribution | null;
  guideStatus: "Needs recording" | "Guide uploaded";
};

type TextAttribution = {
  source: string;
  url: string;
  englishVersionTitle: string;
  englishVersionSource: string;
  englishLicense: string;
  hebrewVersionTitle: string;
  hebrewVersionSource: string;
  hebrewLicense: string;
};

type SefariaTextPayload = {
  ref: string;
  heRef: string;
  hebrewText: string;
  englishText: string;
  attribution: TextAttribution;
};

const starterStudent: StudentSetup = {
  id: "student-1",
  studentName: "New student",
  hebrewName: "",
  fatherName: "",
  motherName: "",
  lineage: "Yisrael",
  barMitzvahDate: "",
  serviceTime: "Morning",
  sectionType: "Maftir",
  customAliyah: "",
  textReference: "",
  parashaConfirmed: "",
  fetchedRef: "",
  fetchedHeRef: "",
  hebrewText: "",
  englishText: "",
  textAttribution: null,
  guideStatus: "Needs recording",
};

const serviceCopy: Record<ServiceTime, string> = {
  Morning: "Use that week's Parasha as the starting suggestion.",
  Afternoon: "Use the following week's Parasha as the starting suggestion.",
};

export default function TeacherDashboard() {
  const [students, setStudents] = useState<StudentSetup[]>([starterStudent]);
  const [selectedId, setSelectedId] = useState(starterStudent.id);
  const [message, setMessage] = useState("");
  const [lastMessage, setLastMessage] = useState("");

  const selected = useMemo(
    () => students.find((student) => student.id === selectedId) ?? students[0],
    [selectedId, students]
  );

  function updateSelected(update: Partial<StudentSetup>) {
    setStudents((current) =>
      current.map((student) =>
        student.id === selected.id ? { ...student, ...update } : student
      )
    );
  }

  function addStudent() {
    const next: StudentSetup = {
      ...starterStudent,
      id: `student-${Date.now()}`,
      studentName: `Student ${students.length + 1}`,
    };
    setStudents((current) => [...current, next]);
    setSelectedId(next.id);
  }

  function saveMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setLastMessage(message.trim());
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f5] text-[#17201b]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#d9ded7] pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#43766c]">
              BarmiBuddy Teacher
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111814] md:text-4xl">
              Set up the exact reading, then record your voice.
            </h1>
          </div>
          <button
            className="h-11 rounded-md bg-[#17201b] px-4 text-sm font-semibold text-white transition hover:bg-[#2b3a32]"
            onClick={addStudent}
            type="button"
          >
            Add student
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-[#d9ded7] bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#627169]">
                Students
              </h2>
              <span className="rounded-full bg-[#e9eee9] px-2 py-1 text-xs font-semibold text-[#42524a]">
                {students.length}
              </span>
            </div>
            <div className="space-y-2">
              {students.map((student) => (
                <button
                  className={`w-full rounded-md border p-3 text-left transition ${
                    selected.id === student.id
                      ? "border-[#43766c] bg-[#edf5f2]"
                      : "border-[#e2e6e1] bg-white hover:bg-[#f7f8f6]"
                  }`}
                  key={student.id}
                  onClick={() => setSelectedId(student.id)}
                  type="button"
                >
                  <span className="block text-sm font-semibold">
                    {student.studentName || "Unnamed student"}
                  </span>
                  <span className="mt-1 block text-xs text-[#68736d]">
                    {student.textReference || "Needs text reference"}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="grid gap-5">
            <StudentSetupPanel student={selected} updateStudent={updateSelected} />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
              <ReadingPlanPanel student={selected} updateStudent={updateSelected} />
              <TeacherActionsPanel
                lastMessage={lastMessage}
                message={message}
                onMessageChange={setMessage}
                onMessageSubmit={saveMessage}
                student={selected}
                updateStudent={updateSelected}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StudentSetupPanel({
  student,
  updateStudent,
}: {
  student: StudentSetup;
  updateStudent: (update: Partial<StudentSetup>) => void;
}) {
  return (
    <section className="rounded-lg border border-[#d9ded7] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Student setup</h2>
          <p className="mt-1 text-sm text-[#68736d]">
            Teacher confirms the real details. The app does not guess the final
            reading.
          </p>
        </div>
        <div className="rounded-md bg-[#f0f4f1] px-3 py-2 text-sm text-[#42524a]">
          {serviceCopy[student.serviceTime]}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Student name"
          onChange={(studentName) => updateStudent({ studentName })}
          value={student.studentName}
        />
        <Field
          label="Hebrew name"
          onChange={(hebrewName) => updateStudent({ hebrewName })}
          value={student.hebrewName}
        />
        <Field
          label="Father's name"
          onChange={(fatherName) => updateStudent({ fatherName })}
          value={student.fatherName}
        />
        <Field
          label="Mother's name"
          onChange={(motherName) => updateStudent({ motherName })}
          value={student.motherName}
        />
        <Field
          label="Bar Mitzvah date"
          onChange={(barMitzvahDate) => updateStudent({ barMitzvahDate })}
          type="date"
          value={student.barMitzvahDate}
        />
        <SelectField
          label="Cohen, Levi, or Yisrael"
          onChange={(lineage) => updateStudent({ lineage: lineage as Lineage })}
          options={["Cohen", "Levi", "Yisrael"]}
          value={student.lineage}
        />
        <SelectField
          label="Service"
          onChange={(serviceTime) =>
            updateStudent({ serviceTime: serviceTime as ServiceTime })
          }
          options={["Morning", "Afternoon"]}
          value={student.serviceTime}
        />
        <SelectField
          label="Section type"
          onChange={(sectionType) =>
            updateStudent({ sectionType: sectionType as SectionType })
          }
          options={["Maftir", "Haftarah", "Custom Aliyah"]}
          value={student.sectionType}
        />
      </div>

      {student.sectionType === "Custom Aliyah" ? (
        <div className="mt-4 max-w-md">
          <Field
            label="Custom Aliyah name"
            onChange={(customAliyah) => updateStudent({ customAliyah })}
            placeholder="e.g. Shishi"
            value={student.customAliyah}
          />
        </div>
      ) : null}
    </section>
  );
}

function ReadingPlanPanel({
  student,
  updateStudent,
}: {
  student: StudentSetup;
  updateStudent: (update: Partial<StudentSetup>) => void;
}) {
  const [isFetchingText, setIsFetchingText] = useState(false);
  const [fetchError, setFetchError] = useState("");

  async function fetchText() {
    if (!student.textReference.trim()) {
      setFetchError("Enter the exact book, chapter, and verse range first.");
      return;
    }

    setIsFetchingText(true);
    setFetchError("");

    try {
      const response = await fetch(
        `/api/sefaria-text?ref=${encodeURIComponent(student.textReference)}`
      );
      const payload = (await response.json()) as
        | SefariaTextPayload
        | { error?: string };

      if (!response.ok || !isSefariaTextPayload(payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Could not load that reference."
        );
      }

      updateStudent({
        fetchedRef: payload.ref,
        fetchedHeRef: payload.heRef,
        hebrewText: payload.hebrewText,
        englishText: payload.englishText,
        textAttribution: payload.attribution,
      });
    } catch (error) {
      setFetchError(
        error instanceof Error
          ? error.message
          : "Could not load that reference."
      );
    } finally {
      setIsFetchingText(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#d9ded7] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Reading plan</h2>
      <p className="mt-1 text-sm text-[#68736d]">
        Date logic gives a suggestion only. The teacher enters the exact book,
        chapter, and verse range.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field
          label="Confirmed Parasha"
          onChange={(parashaConfirmed) => updateStudent({ parashaConfirmed })}
          placeholder="e.g. Vayikra"
          value={student.parashaConfirmed}
        />
        <Field
          label="Text reference"
          onChange={(textReference) => updateStudent({ textReference })}
          placeholder="Exodus 24:16-18"
          value={student.textReference}
        />
      </div>

      <div className="mt-5 rounded-md border border-[#d9ded7] bg-[#f8faf8] p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#627169]">
          Text source rule
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#3e4b44]">
          Automatic text loading uses Sefaria because it has a developer API.
          Chabad.org stays manual-only unless they give written API/licensing
          permission.
        </p>
      </div>

      <div className="mt-5 rounded-md border border-[#d9ded7] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold">Fetch Hebrew text</h3>
            <p className="mt-1 text-sm text-[#68736d]">
              Pull the exact reference, then let the teacher confirm or edit it.
            </p>
          </div>
          <button
            className="h-10 rounded-md bg-[#43766c] px-4 text-sm font-semibold text-white transition hover:bg-[#315950] disabled:cursor-not-allowed disabled:bg-[#9ca9a2]"
            disabled={isFetchingText}
            onClick={fetchText}
            type="button"
          >
            {isFetchingText ? "Fetching..." : "Fetch from Sefaria"}
          </button>
        </div>

        {fetchError ? (
          <p className="mt-3 rounded-md border border-[#f2b8b5] bg-[#fff2f1] p-3 text-sm text-[#9d2420]">
            {fetchError}
          </p>
        ) : null}

        {student.hebrewText ? (
          <div className="mt-4 grid gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#627169]">
                Loaded reference
              </p>
              <p className="text-sm font-semibold text-[#17201b]">
                {student.fetchedRef}
                {student.fetchedHeRef ? ` / ${student.fetchedHeRef}` : ""}
              </p>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#627169]">
                Hebrew text to practise
              </span>
              <textarea
                className="mt-2 min-h-40 w-full resize-y rounded-md border border-[#cfd7d0] bg-white px-3 py-3 text-right text-2xl leading-10 outline-none transition focus:border-[#43766c] focus:ring-2 focus:ring-[#cfe3dc]"
                dir="rtl"
                lang="he"
                onChange={(event) =>
                  updateStudent({ hebrewText: event.target.value })
                }
                value={student.hebrewText}
              />
            </label>

            {student.englishText ? (
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#627169]">
                  English support text
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#cfd7d0] bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-[#43766c] focus:ring-2 focus:ring-[#cfe3dc]"
                  onChange={(event) =>
                    updateStudent({ englishText: event.target.value })
                  }
                  value={student.englishText}
                />
              </label>
            ) : null}

            {student.textAttribution ? (
              <div className="rounded-md bg-[#f0f4f1] p-3 text-xs leading-5 text-[#42524a]">
                Source: {student.textAttribution.source}
                {student.textAttribution.hebrewVersionTitle
                  ? `, Hebrew version: ${student.textAttribution.hebrewVersionTitle}`
                  : ""}
                {student.textAttribution.hebrewLicense
                  ? `, licence: ${student.textAttribution.hebrewLicense}`
                  : ""}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <StatusTile label="Date logic" value={`${student.serviceTime} service`} />
        <StatusTile
          label="Teacher confirmation"
          value={student.hebrewText ? "Text loaded" : "Still needed"}
        />
        <StatusTile label="Guide track" value={student.guideStatus} />
      </div>
    </section>
  );
}

function TeacherActionsPanel({
  lastMessage,
  message,
  onMessageChange,
  onMessageSubmit,
  student,
  updateStudent,
}: {
  lastMessage: string;
  message: string;
  onMessageChange: (value: string) => void;
  onMessageSubmit: (event: FormEvent<HTMLFormElement>) => void;
  student: StudentSetup;
  updateStudent: (update: Partial<StudentSetup>) => void;
}) {
  return (
    <section className="rounded-lg border border-[#d9ded7] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Teacher actions</h2>
      <p className="mt-1 text-sm text-[#68736d]">
        Same setup for every teacher. Your recording is what makes the practice
        personal.
      </p>

      <div className="mt-5 rounded-md border border-[#d9ded7] p-4">
        <h3 className="font-semibold">Guide recording</h3>
        <p className="mt-1 text-sm text-[#68736d]">
          Record or upload the guide track for {student.studentName || "this student"}.
        </p>
        <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#94a39a] bg-[#f8faf8] px-4 text-center transition hover:border-[#43766c] hover:bg-[#edf5f2]">
          <span className="text-sm font-semibold">Choose audio file</span>
          <span className="mt-1 text-xs text-[#68736d]">
            Phone recording support should use this same section when wired.
          </span>
          <input
            accept="audio/*"
            className="sr-only"
            onChange={() => updateStudent({ guideStatus: "Guide uploaded" })}
            type="file"
          />
        </label>
      </div>

      <form className="mt-5 rounded-md border border-[#d9ded7] p-4" onSubmit={onMessageSubmit}>
        <h3 className="font-semibold">Message student</h3>
        <textarea
          className="mt-3 min-h-24 w-full resize-none rounded-md border border-[#cfd7d0] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#43766c] focus:ring-2 focus:ring-[#cfe3dc]"
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Write a quick note or answer a question..."
          value={message}
        />
        <button
          className="mt-3 h-10 rounded-md bg-[#43766c] px-4 text-sm font-semibold text-white transition hover:bg-[#315950]"
          type="submit"
        >
          Send message
        </button>
        {lastMessage ? (
          <p className="mt-3 rounded-md bg-[#f0f4f1] p-3 text-sm text-[#3e4b44]">
            Last message: {lastMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "date" | "text";
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#627169]">
        {label}
      </span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-[#cfd7d0] bg-white px-3 text-sm outline-none transition focus:border-[#43766c] focus:ring-2 focus:ring-[#cfe3dc]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#627169]">
        {label}
      </span>
      <select
        className="mt-2 h-11 w-full rounded-md border border-[#cfd7d0] bg-white px-3 text-sm outline-none transition focus:border-[#43766c] focus:ring-2 focus:ring-[#cfe3dc]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d9ded7] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#627169]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#17201b]">{value}</p>
    </div>
  );
}

function isSefariaTextPayload(
  payload: SefariaTextPayload | { error?: string }
): payload is SefariaTextPayload {
  return (
    "ref" in payload &&
    "hebrewText" in payload &&
    typeof payload.ref === "string" &&
    typeof payload.hebrewText === "string"
  );
}
