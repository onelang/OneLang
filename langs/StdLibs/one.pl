package One;

sub str_replace
{
    my ($string, $find, $replace) = @_;

    my $pos = index($string, $find);

    while($pos > -1) {
        substr($string, $pos, length($find), $replace);
        $pos = index($string, $find, $pos + length($replace));
    }
    
    return $string;
}

package OneRegex;

sub matchFromIndex
{
    my ($pattern, $input, $offset) = @_;
    pos($input) = $offset;
    my @matches = ($input =~ /\G$pattern/g);
    my $result = scalar(@matches) ? \@matches : undef;
    return $result;
}

1;