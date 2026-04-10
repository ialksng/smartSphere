import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function DocEditor() {
  const { id } = useParams();

  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchDoc();
  }, []);

  const fetchDoc = async () => {
    const res = await axios.get(`/api/dochub/${id}`);
    setDoc(res.data);
    setContent(res.data.content);
  };

  const saveDoc = async () => {
    await axios.put(`/api/dochub/${id}`, { content });
    alert("Saved!");
  };

  if (!doc) return <p>Loading...</p>;

  return (
    <div>
      <h2>{doc.name}</h2>

      <p>Source: {doc.source}</p>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={20}
        cols={80}
      />

      <br />
      <button onClick={saveDoc}>Save</button>
    </div>
  );
}