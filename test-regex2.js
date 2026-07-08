const text = 'const [count, setCount] = useState(0) // !label[6:23](state variable)';
const regex = /^(.*?)\/\/\s*!(\w+)(?:\[(\d+):(\d+)\]|(?:\[?\/((?:[^\/\\]|\\.)+)\/([gimsuy]*)\]?))?\s*(?:\(([^)]*)\)|(.*))?\s*$/;
const match = text.match(regex);
console.log(match);
