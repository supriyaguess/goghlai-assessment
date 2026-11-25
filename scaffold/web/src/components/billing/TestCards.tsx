const CARDS = [
  ['4242 4242 4242 4242', 'Payment succeeds'],
  ['4000 0000 0000 0002', 'Card is declined'],
  ['4000 0000 0000 9995', 'Declined, insufficient funds'],
  ['4000 0000 0000 0341', 'First charge works, then declined at renewal'],
  ['4000 0025 0000 3155', 'Needs approval at the bank'],
];

export function TestCards() {
  return (
    <details className="test-cards">
      <summary>Test cards</summary>
      <p>This is a demo environment. Use any future expiry date and any 3 digit security code.</p>
      <ul>
        {CARDS.map(([number, note]) => (
          <li key={number}>
            <code>{number}</code>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
