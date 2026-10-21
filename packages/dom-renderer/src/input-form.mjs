import { validateInputDeclaration, validateInputValues } from '@zixcel/interaction/input';
import { element, valueView, fail } from './dom-elements.mjs';
import { record } from './world-api.mjs';
function scalar(value) {
    if (value.type === 'boolean')
        return { type: 'boolean' };
    if (value.type === 'string' || value.type === 'number' || value.type === 'integer')
        return value;
    return fail('InvalidInputDeclaration');
}
export function inputForm(document, declaration, onSubmit) {
    if (validateInputDeclaration(declaration).length || declaration.action.input_schema.type !== 'object')
        fail('InvalidInputDeclaration');
    const contract = declaration.action.input_schema, required = contract.required ?? [];
    const form = element(document, 'form'), fields = new Map(), abort = new AbortController(), prefix = 'input-' + crypto.randomUUID();
    const fieldIds = [...new Set([...required, ...Object.keys(declaration.fields)])];
    for (const id of fieldIds) {
        const field = declaration.fields[id], schema = scalar(contract.fields[id]), label = element(document, 'label'), name = element(document, 'span', field.label);
        let input;
        if (field.choices) {
            input = element(document, 'select');
            input.append(element(document, 'option', 'Choose…', { value: '' }));
            for (const choice of field.choices)
                input.append(element(document, 'option', choice.label, { value: choice.value }));
        }
        else if (schema.type === 'string' && (schema.max_length ?? 0) > 255 && !field.sensitive) {
            input = element(document, 'textarea');
            input.rows = 4;
            input.maxLength = schema.max_length ?? 4096;
        }
        else {
            input = element(document, 'input');
            input.type = schema.type === 'boolean' ? 'checkbox' : schema.type === 'integer' || schema.type === 'number' ? 'number' : field.sensitive ? 'password' : 'text';
            if (schema.type === 'string')
                input.maxLength = schema.max_length ?? 4096;
            if (schema.type === 'integer')
                input.step = '1';
            if (schema.type === 'number')
                input.step = 'any';
            if (schema.type === 'integer' || schema.type === 'number') {
                input.min = String(schema.minimum);
                input.max = String(schema.maximum);
            }
        }
        input.id = prefix + '-' + fields.size;
        input.name = id;
        input.autocomplete = 'off';
        label.htmlFor = input.id;
        label.append(name);
        form.append(label, input);
        fields.set(id, { input, schema });
    }
    const submit = element(document, 'button', 'Submit', { type: 'submit' }), status = element(document, 'div', '', { role: 'status' });
    form.append(submit, status);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submit.disabled)
            return;
        const values = {};
        for (const [id, { input, schema }] of fields) {
            if (input.value === '' && schema.type !== 'boolean' && !required.includes(id))
                continue;
            if (schema.type === 'boolean')
                values[id] = 'checked' in input ? input.checked : false;
            else if (schema.type === 'integer' || schema.type === 'number') {
                if (input.value === '') {
                    status.textContent = 'Check the declared input constraints.';
                    return;
                }
                values[id] = Number(input.value);
            }
            else
                values[id] = input.value;
        }
        if (validateInputValues(declaration, values).length) {
            status.textContent = 'Check the declared input constraints.';
            return;
        }
        submit.disabled = true;
        form.setAttribute('aria-busy', 'true');
        try {
            await onSubmit(values);
            if (!abort.signal.aborted)
                status.textContent = 'Submitted.';
        }
        catch (error) {
            const value = record(error);
            if (!abort.signal.aborted) {
                status.setAttribute('role', 'alert');
                status.replaceChildren(valueView(document, { code: value.code ?? 'OperationUnavailable', ...(value.ownerFailure ? { ownerFailure: value.ownerFailure } : {}) }));
            }
        }
        finally {
            for (const { input } of fields.values())
                if (input.type === 'password')
                    input.value = '';
            submit.disabled = false;
            form.setAttribute('aria-busy', 'false');
        }
    }, { signal: abort.signal });
    return { form, close() { abort.abort(); for (const { input } of fields.values())
            input.value = ''; form.remove(); } };
}
