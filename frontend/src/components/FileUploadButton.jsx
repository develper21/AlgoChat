const FileUploadButton = ({ onSelect }) => (
  <label className="file-upload">
    📎
    <input type="file" onChange={(e) => onSelect(e.target.files?.[0] || null)} />
  </label>
);

export default FileUploadButton;
