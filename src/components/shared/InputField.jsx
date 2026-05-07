import React from 'react';

const InputField = ({ label, name, placeholder, type = "text", value, onChange, id }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{label}</label>
    <input 
      id={id} 
      name={name} 
      className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-red-500 font-bold outline-none shadow-inner text-sm dark:bg-slate-950 dark:text-white" 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      type={type} 
    />
  </div>
);

export default InputField;
