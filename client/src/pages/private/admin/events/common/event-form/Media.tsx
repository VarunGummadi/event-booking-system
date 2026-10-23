import { Button, Upload } from "antd";
import type { EventFormStepProp } from "./EventForm";

function Media({
  currentStep,
  setCurrentStep,
  selectedMediaFiles,
  setSelectedMediaFiles,
  existingMediaUrls = [],
  setExistingMediaUrls,
  loading,
}: EventFormStepProp) {
  // Remove a newly added (local File) item
  const onNewFileRemove = (index: number) => {
    setSelectedMediaFiles((prev: File[]) =>
      prev.filter((_: File, i: number) => i !== index)
    );
  };

  // Remove an already-saved URL (edit mode)
  const onExistingUrlRemove = (index: number) => {
    setExistingMediaUrls((prev: string[]) =>
      prev.filter((_: string, i: number) => i !== index)
    );
  };

  //const isLastStep = type === undefined || type === "create"
    //? false
    //: false; // Media is always step 3, Next goes to Tickets

  return (
    <div className="flex flex-col gap-5">
      <Upload
        listType="picture-card"
        beforeUpload={(file) => {
          setSelectedMediaFiles((prev: File[]) => [...prev, file]);
          return false;
        }}
        multiple
        showUploadList={false}
      >
        <span className="text-gray-500 text-xs">Click Here To Upload</span>
      </Upload>

      <div className="flex flex-wrap gap-5">
        {/* Existing saved images from the database (edit mode) */}
        {existingMediaUrls.map((url: string, index: number) => (
          <div
            key={`existing-${index}`}
            className="border p-3 border-solid border-gray-200 flex flex-col gap-3"
          >
            <img
              src={url}
              alt="existing media"
              className="w-40 h-40 object-cover"
            />
            <span
              className="underline text-sm text-center cursor-pointer text-red-500"
              onClick={() => onExistingUrlRemove(index)}
            >
              Remove
            </span>
          </div>
        ))}

        {/* Newly selected local files in this session */}
        {selectedMediaFiles.map((file: File, index: number) => (
          <div
            key={`new-${index}`}
            className="border p-3 border-solid border-blue-300 flex flex-col gap-3"
          >
            <img
              src={URL.createObjectURL(file)}
              alt="new media"
              className="w-40 h-40 object-cover"
            />
            <span className="text-xs text-center text-blue-500">New</span>
            <span
              className="underline text-sm text-center cursor-pointer text-red-500"
              onClick={() => onNewFileRemove(index)}
            >
              Remove
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-10 justify-between">
        <Button
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="primary"
          onClick={() => setCurrentStep(currentStep + 1)}
          disabled={loading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default Media;