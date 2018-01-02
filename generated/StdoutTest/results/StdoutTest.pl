use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub reverse_string {
    my ( $self, $str ) = @_;
    my $result = "";
    for (my $i = length($str) - 1; $i >= 0; $i--) {
        $result .= (substr $str, $i, 1);
    }
    return $result;
}

sub test_method {
    my ( $self ) = @_;
    print(($self->reverse_string("print value")) . "\n");
    return "return value";
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}